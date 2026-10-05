const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = process.cwd();
const ts = require(path.join(root, 'vcard-qr-next/node_modules/typescript'));
function load(file, mocks = {}, globals = {}) {
  let source = fs.readFileSync(path.join(root, file), 'utf8');
  if (file.endsWith('.ts')) source = ts.transpileModule(source, {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  const exports={}; const context={exports,module:{exports},console,URL,URLSearchParams,Date,process:{env:{NODE_ENV:'production',DODO_PRODUCT_ID_STARTER:'product-starter',NEXT_PUBLIC_SUPABASE_URL:'https://example.test',SUPABASE_SERVICE_ROLE_KEY:'test-only'}}, require:key=> {if(!(key in mocks))throw Error('unexpected import '+key);return mocks[key]},...globals};
  vm.runInNewContext(source,context,{filename:file});return file.endsWith('.ts')?exports:context.module.exports;
}
function browser(consent='accepted',search='') {
  const store=new Map(consent?[['cookie_consent',consent]]:[]);const storage={getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)};const calls=[];
  const window={location:{hostname:'app.vcardqrcodegenerator.com',origin:'https://app.vcardqrcodegenerator.com',pathname:'/dashboard',href:'https://app.vcardqrcodegenerator.com/dashboard?payment_id=secret',search},localStorage:storage,sessionStorage:storage,gtag:(...args)=>calls.push(args),document:{title:'test'}};
  return {store,calls,window,globals:{window,localStorage:storage,sessionStorage:storage,document:window.document}};
}
for (const file of ['analytics.js','vcard-qr-next/src/lib/analytics.ts']) {
  test(file+' consent gates events, storage and purchase markers',()=>{
    const b=browser(null,'?utm_campaign=event&email=private');const a=load(file,{},b.globals);
    assert.equal(a.trackPurchase({transaction_id:'pay-real'}),false);assert.equal(a.trackSignUp({}),false);
    assert.equal(Object.keys(a.captureAttribution()).length,0);assert.equal(b.store.size,0);assert.equal(b.calls.length,0);
    b.store.set('cookie_consent','rejected');assert.equal(a.trackEvent('denied'),false);
    b.store.set('cookie_consent','accepted');assert.equal(a.captureAttribution().utm_campaign,'event');assert.equal(a.getAttributionParams().email,undefined);
    assert.equal(a.trackPurchase({transaction_id:'pay-real',value:4.5,currency:'USD'}),true);
    assert.equal(a.trackPurchase({transaction_id:'pay-real'}),false);
    assert.equal(b.calls.filter(x=>x[1]==='purchase').length,1);assert.equal(b.calls[0][2].page_location.includes('payment_id'),false);
  });
  test(file+' QA, missing gtag, and malformed storage do not consume transactions',()=>{
    const b=browser('accepted','?analytics_test=1');const a=load(file,{},b.globals);assert.equal(a.trackPurchase({transaction_id:'pay-test'}),false);assert.equal(b.calls.length,0);
    b.window.location.search='';b.window.gtag=undefined;assert.equal(a.trackPurchase({transaction_id:'pay-real'}),false);assert.equal(a.hasSentPurchase('pay-real'),false);
    b.window.gtag=(...args)=>b.calls.push(args);b.store.set('vcard_ga4_purchase_ids','{}');b.store.set('vcard_ga4_attribution','null');assert.doesNotThrow(()=>a.captureAttribution());assert.equal(a.trackPurchase({transaction_id:'pay-real'}),true);
  });
}
test('first OAuth sign-in differs from returning login and invalid timestamps',()=>{
  const {isFirstSignIn}=load('vcard-qr-next/src/lib/signup.ts');const now=Date.parse('2026-10-05T14:00:00Z');
  assert.equal(isFirstSignIn({created_at:'2026-10-05T13:59:59Z',last_sign_in_at:'2026-10-05T14:00:00Z'},now),true);
  assert.equal(isFirstSignIn({created_at:'2026-08-01T14:00:00Z',last_sign_in_at:'2026-10-05T14:00:00Z'},now),false);
  assert.equal(isFirstSignIn({},now),false);
});
function verification({user={id:'owner'},session={payment_status:'succeeded',payment_id:'pay-real'},payment={status:'succeeded',metadata:{user_id:'owner'},product_id:'product-starter',total_amount:450,currency:'USD',created_at:new Date().toISOString()},subscription={status:'active',metadata:{user_id:'owner'},product_id:'product-starter'}}={}) {
  const updates=[];let providerCalls=0;
  const admin={from:()=>({upsert:async v=>{updates.push(v);return {error:null}}})};
  const DodoPayments={getCheckoutSessionStatus:async()=>{providerCalls++;return session},getPayment:async()=>payment,getSubscription:async()=>{providerCalls++;return subscription}};
  const {POST}=load('vcard-qr-next/src/app/api/subscription/verify/route.ts',{'@/utils/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'@supabase/supabase-js':{createClient:()=>admin},'@/utils/dodo':{DodoPayments},'next/server':{NextResponse:{json:(body,opts)=>({body,status:opts?.status||200})}}});
  return {POST,updates,get providerCalls(){return providerCalls}};
}
test('verified owned payment reports actual amount and payment ID',async()=>{
  const v=verification();const r=await v.POST({json:async()=>({sessionId:'checkout'})});assert.equal(r.body.success,true);assert.equal(r.body.payment_id,'pay-real');assert.equal(r.body.value,4.5);assert.equal(r.body.revenue_verified,true);assert.equal(v.updates.length,1);
});
test('subscription entitlement does not invent revenue or a charge ID',async()=>{
  const v=verification();const r=await v.POST({json:async()=>({subscriptionId:'sub-real'})});assert.equal(r.body.success,true);assert.equal(r.body.revenue_verified,false);assert.equal(r.body.payment_id,undefined);assert.equal(r.body.value,undefined);
});
for (const override of [{payment:{status:'succeeded',metadata:{user_id:'someone-else'},product_id:'product-starter'}},{payment:{status:'failed',metadata:{user_id:'owner'},product_id:'product-starter'}},{payment:{status:'succeeded',metadata:{user_id:'owner'},product_id:'unknown'}},{session:{payment_status:'pending'}}]) {
  test('unpaid, foreign or unknown payments fail closed '+JSON.stringify(override),async()=>{const v=verification(override);const r=await v.POST({json:async()=>({sessionId:'checkout'})});assert.equal(r.body.success,false);assert.equal(v.updates.length,0)});
}
test('unauthenticated verification never queries Dodo or writes entitlement',async()=>{const v=verification({user:null});const r=await v.POST({json:async()=>({subscriptionId:'sub'})});assert.equal(r.status,401);assert.equal(v.providerCalls,0);assert.equal(v.updates.length,0)});
test('restored directory pages match original www canonicals and consent loads first',()=>{
  for (const slug of ['sales-representative-new-york','real-estate-agent-los-angeles']) {
    const html=fs.readFileSync(path.join(root,'p',slug,'index.html'),'utf8');assert.ok(html.includes('href="https://www.vcardqrcodegenerator.com/p/'+slug+'/"'));assert.ok(html.includes('<head><script src="/consent.js"></script>'));assert.equal(html.includes('The #1 QR Code Tool'),false);
  }
});

test('zero-value or unpriced payment grants entitlement without inventing revenue',async()=>{
 for(const total_amount of [0,undefined]) {const v=verification({payment:{status:'succeeded',metadata:{user_id:'owner'},product_id:'product-starter',total_amount,currency:'USD',created_at:new Date().toISOString()}});const r=await v.POST({json:async()=>({sessionId:'checkout'})});assert.equal(r.body.success,true);assert.equal(r.body.revenue_verified,false);assert.equal(v.updates.length,1)}
});

test('QA opt-out is established before automatic GA configuration',()=>{
 const b=browser('accepted','?analytics_test=1');const listeners={};b.globals.location=b.window.location;b.globals.Event=class {constructor(type){this.type=type}};b.window.dispatchEvent=()=>{};b.globals.document={cookie:'vcard_consent=accepted',addEventListener:(n,fn)=>listeners[n]=fn};b.globals.window.dataLayer=[];load('consent.js',{},b.globals);assert.equal(b.window['ga-disable-G-E90B41BNEH'],true);assert.equal(b.store.get('vcard_analytics_test'),'1');
 b.window.location.search='';load('consent.js',{},b.globals);assert.equal(b.window['ga-disable-G-E90B41BNEH'],true);
});

test('legacy payment-ID return verifies the charge and current owned subscription',async()=>{const v=verification({payment:{status:'succeeded',metadata:{user_id:'owner'},subscription_id:'sub-real',total_amount:450,currency:'USD'},subscription:{status:'active',metadata:{user_id:'owner'},product_id:'product-starter',next_billing_date:new Date(Date.now()+86400000).toISOString()}});const r=await v.POST({json:async()=>({paymentId:'pay-real',subscriptionId:'sub-real'})});assert.equal(r.body.revenue_verified,true);assert.equal(r.body.value,4.5);assert.equal(v.updates.length,1)});
test('replaying an expired payment cannot extend entitlement',async()=>{const v=verification({payment:{status:'succeeded',metadata:{user_id:'owner'},product_id:'product-starter',total_amount:500,currency:'USD',created_at:'2020-01-01T00:00:00Z'}});const r=await v.POST({json:async()=>({paymentId:'pay-old'})});assert.equal(r.status,403);assert.equal(v.updates.length,0)});

test('signup completion signal is authenticated and bound to its account',async()=>{
 for(const [user,signal,expected] of [[{id:'owner'},'owner:google',true],[{id:'owner'},'foreign:google',false],[null,'owner:google',false],[{id:'owner'},'owner:unknown',false]]) {
 const {GET}=load('vcard-qr-next/src/app/api/analytics/signup/route.ts',{'@/utils/supabase/server':{createClient:async()=>({auth:{getUser:async()=>({data:{user}})}})},'next/headers':{cookies:async()=>({get:()=>({value:signal})})},'next/server':{NextResponse:{json:(body,opts)=>({body,headers:opts.headers})}}});const r=await GET();assert.equal(r.body.completed,expected);assert.equal(r.body.id,undefined);assert.equal(r.headers['Cache-Control'],'no-store');}
});

test('all restored pages have available stylesheet/font assets and social metadata',()=>{for(const slug of fs.readdirSync(path.join(root,'p'))) {const file=path.join(root,'p',slug,'index.html');if(!fs.existsSync(file))continue;const h=fs.readFileSync(file,'utf8');for(const match of h.matchAll(/(?:href|src)="(\/p\/_next\/[^"?]+)/g))assert.equal(fs.existsSync(path.join(root,match[1])),true,match[1]);assert.ok(h.includes('og:description'));}});
