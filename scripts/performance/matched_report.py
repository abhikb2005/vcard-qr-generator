"""Read-only, fixed-window reporting. Outputs private aggregates; never launches OAuth."""
import argparse, json
from pathlib import Path
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import RunReportRequest, DateRange, Dimension, Metric

WINDOWS={'current':('2026-09-05','2026-10-02'),'previous':('2026-08-08','2026-09-04')}
SITE='sc-domain:vcardqrcodegenerator.com'
p=argparse.ArgumentParser();p.add_argument('--tokens',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args()
args.output.mkdir(parents=True,exist_ok=True)
out={'checked_at_utc':datetime.now(timezone.utc).isoformat(),'windows':WINDOWS,'gsc_timezone':'America/Los_Angeles','notes':['Both windows contain four of every weekday. Query rows omit anonymized searches; do not sum them as site totals.','GA4 dates use property timezone; exact timezone requires GA Admin UI. Final GSC data only.'],'errors':{}}
def creds(name,scope):
 c=Credentials.from_authorized_user_file(str(args.tokens/name),[scope]);c.refresh(Request());return c
try:
 svc=build('searchconsole','v1',credentials=creds('token.json','https://www.googleapis.com/auth/webmasters'),cache_discovery=False)
 out['gsc']={}
 for label,(start,end) in WINDOWS.items():
  result={}
  for dims in [[],['date'],['page'],['query'],['country'],['device'],['query','country','device']]:
   homepage=len(dims)==3
   base={'startDate':start,'endDate':end,'dimensions':dims,'type':'web','dataState':'final','rowLimit':25000}
   if homepage:base['dimensionFilterGroups']=[{'filters':[{'dimension':'page','operator':'includingRegex','expression':r'^https://(www\.)?vcardqrcodegenerator\.com/$'}]}]
   rows=[]
   while True:
    data=svc.searchanalytics().query(siteUrl=SITE,body={**base,'startRow':len(rows)}).execute();batch=data.get('rows',[]);rows.extend(batch)
    if len(batch)<25000:break
   result['homepage_query_country_device' if homepage else ('_'.join(dims) or 'total')]=rows
  out['gsc'][label]=result
 out['indexing']={}
 for path in ['/dynamic-qr-code-generator.html','/p/sales-representative-new-york/','/p/real-estate-agent-los-angeles/']:
  try:out['indexing'][path]=svc.urlInspection().index().inspect(body={'inspectionUrl':'https://www.vcardqrcodegenerator.com'+path,'siteUrl':SITE}).execute().get('inspectionResult',{}).get('indexStatusResult',{})
  except Exception as e:out['indexing'][path]={'error':type(e).__name__}
except Exception as e:out['errors']['gsc']=type(e).__name__+': reporting credential refresh/query failed'
try:
 client=BetaAnalyticsDataClient(credentials=creds('ga4_token.json','https://www.googleapis.com/auth/analytics.readonly'))
 out['ga4']={}
 for label,(start,end) in WINDOWS.items():
  result={}
  for dims,mets in [(['hostName','pagePath'],['screenPageViews','activeUsers']),(['eventName'],['eventCount','totalUsers']),(['country','deviceCategory'],['sessions','activeUsers'])]:
   response=client.run_report(RunReportRequest(property='properties/505092702',date_ranges=[DateRange(start_date=start,end_date=end)],dimensions=[Dimension(name=n) for n in dims],metrics=[Metric(name=n) for n in mets],limit=100000))
   result['_'.join(dims)]={'dimensions':dims,'metrics':mets,'rows':[{'dimensions':[v.value for v in r.dimension_values],'metrics':[v.value for v in r.metric_values]} for r in response.rows],'row_count':response.row_count,'metadata':{'subject_to_thresholding':response.metadata.subject_to_thresholding}}
  out['ga4'][label]=result
except Exception as e:out['errors']['ga4']=type(e).__name__+': reporting credential refresh/query failed'
(args.output/'matched-28-report.json').write_text(json.dumps(out,indent=2))
print(json.dumps({'windows':WINDOWS,'errors':out['errors'],'output':str(args.output/'matched-28-report.json')}))
