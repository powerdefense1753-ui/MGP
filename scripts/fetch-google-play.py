"""Read a small explicit seed list of public US-English listings; no login or access-control bypass."""
import urllib.request,concurrent.futures,json,re,html,datetime,pathlib,time
ROOT=pathlib.Path(__file__).resolve().parents[1]
SEEDS=['com.unciv.app','air.com.midjiwan.polytopia','io.anuke.mindustry','com.birdshel.Uciana','yio.tro.achikaps','com.corrodinggames.rts','com.playdigious.northgard','com.feralinteractive.rometw','com.ironhidegames.android.kingdomrush','age.of.civilizations2.jakowski.lukasz','com.longyoug.hmby']
def fetch(package):
 url='https://play.google.com/store/apps/details?id='+package+'&hl=en&gl=US'
 try:
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=30) as r: raw=r.read().decode('utf-8');status=r.status
  chunks=re.findall(r'<script[^>]*type="application/ld\+json"[^>]*>(.*?)</script>',raw,re.S)
  ld=next((json.loads(x) for x in chunks if 'SoftwareApplication' in x),None)
  if not ld:raise ValueError('Missing SoftwareApplication structured data')
  s=re.sub(r'<(script|style)\b[^>]*>.*?</\1>',' ',raw,flags=re.S|re.I);s=re.sub(r'\s+',' ',html.unescape(re.sub('<[^>]+>',' ',s))).strip()
  desc=html.unescape(re.sub('<[^>]+>',' ',ld.get('description','')))
  item={'package':package,'url':url,'fetchedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'locale':'en-US','status':status,'structuredData':ld,'description':desc,'pageText':s.split('Data safety',1)[0]}
  (ROOT/'data/google-play'/f'{package}.json').write_text(json.dumps(item,ensure_ascii=False,indent=2))
  return {'package':package,'name':ld.get('name'),'keys':list(ld),'description':desc,'pageIntro':s[:1400]}
 except Exception as e:return {'package':package,'error':str(e)}
if __name__=='__main__':
 (ROOT/'data/google-play').mkdir(parents=True,exist_ok=True)
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
  results=list(pool.map(fetch,SEEDS))
 (ROOT/'data/google-play/fetch-results.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
 for r in results:print(json.dumps(r,ensure_ascii=False))
 if any('error' in r for r in results):raise SystemExit(1)
