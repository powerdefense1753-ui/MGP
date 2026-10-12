"""Fetch public listing ratings, displayed review samples, and two official screenshots per game."""
import sys,pathlib,json,urllib.request,datetime,concurrent.futures,base64,re,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'.python-deps'))
from bs4 import BeautifulSoup
GAMES=json.loads((ROOT/'src/data/google-play.json').read_text())
CACHE={}
if (ROOT/'src/data/play-details.json').exists():
 for g in json.loads((ROOT/'src/data/play-details.json').read_text()).values():
  for image in g['screenshots']+[g['icon']]:CACHE[image['sourceUrl']]=image
def request(url):
 with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Mozilla/5.0'}),timeout=30) as r:return r.read(),r.headers.get_content_type()
def media(url):
 if url in CACHE and (ROOT/'public'/CACHE[url]['localPath'].lstrip('/')).is_file():return CACHE[url]
 raw,mime=request(url)
 if not mime.startswith('image/'):raise ValueError('Expected image response')
 extension={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}.get(mime)
 if not extension:raise ValueError('Unsupported image type: '+mime)
 name=hashlib.sha256(url.encode()).hexdigest()[:20]+'.'+extension
 folder=ROOT/'public/play-media';folder.mkdir(parents=True,exist_ok=True);(folder/name).write_bytes(raw)
 return {'sourceUrl':url,'localPath':'/play-media/'+name,'mimeType':mime,'bytes':len(raw)}
def get(g):
 raw,_=request(g['sourceUrl']);soup=BeautifulSoup(raw,'html.parser');ld=next(json.loads(x.string) for x in soup.select('script[type="application/ld+json"]') if x.string and 'SoftwareApplication' in x.string)
 reviews=[]
 for body in soup.select('.h3YV2d')[:3]:
  box=body.parent;date=box.select_one('.bp9Aid');stars=box.select_one('[role="img"][aria-label]')
  if body:
   text=body.get_text(' ',strip=True)
   reviews.append({'id':hashlib.sha256(text.encode()).hexdigest()[:16],'text':text,'date':date.get_text(' ',strip=True) if date else None,'stars':stars.get('aria-label') if stars else None})
 if not reviews:raise ValueError(g['id']+' no readable user reviews; inspect markup')
 screenshots=[]
 for im in soup.select('img[data-screenshot-index]')[:2]:
  url=im.get('srcset','').split(' ')[0] or im['src'];screenshots.append(media(url))
 if len(screenshots)<2:raise ValueError(g['id']+' missing screenshots')
 icon=media(ld['image']+'=w96-h96')
 rating=ld.get('aggregateRating',{})
 result={'id':g['id'],'fetchedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'url':g['sourceUrl'],'rating':float(rating['ratingValue']) if rating.get('ratingValue') else None,'ratingCount':int(rating['ratingCount']) if rating.get('ratingCount') else None,'reviews':reviews,'screenshots':screenshots,'icon':icon}
 print(json.dumps({'id':g['id'],'rating':result['rating'],'ratingCount':result['ratingCount'],'reviews':reviews,'screenshots':len(screenshots)},ensure_ascii=False),flush=True)
 return result
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:results=list(pool.map(get,GAMES))
 (ROOT/'data/google-play/review-evidence.json').write_text(json.dumps({g['id']:{'url':g['url'],'fetchedAt':g['fetchedAt'],'reviews':g['reviews']} for g in results},ensure_ascii=False,indent=2))
 for g in results:
  for r in g['reviews']:
   words=r.pop('text').split();r['excerpt']=' '.join(words[:35])+('…' if len(words)>35 else '')
 (ROOT/'src/data/play-details.json').write_text(json.dumps({g['id']:g for g in results},ensure_ascii=False,indent=2))
 print('Saved complete details for',len(results),'games',flush=True)
