console.log('--- ENV CHECK ---');
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING');
console.log('DODO_PAYMENTS_API_KEY:', process.env.DODO_PAYMENTS_API_KEY ? 'PRESENT' : 'MISSING');
console.log('--- END ENV CHECK ---');
