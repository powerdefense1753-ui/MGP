import {allScreenshots} from './play-screenshots.mjs';
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {WINDOW,eligibility,buildGame} from './play-import.mjs';
const read=async(p,fallback)=>JSON.parse(await fs.readFile(p,'utf8').catch(e=>{if(e.code==='ENOENT'&&fallback!==undefined)return JSON.stringify(fallback);throw e;}));
const snapshots=await read('work/play-crawler/snapshots.json');
const candidates=await read('work/play-crawler/candidates.json');
const discovery=await read('work/play-crawler/discovery.json');
const failures=await read('work/play-crawler/failures.json',{});
const originals=new Set((await read('src/data/google-play.json')).map(g=>g.id));
const mediaCache=await read('work/play-crawler/media-cache.json',{});
const mediaErrors=[];
await fs.mkdir('public/play-media',{recursive:true});
let writes=Promise.resolve();
function persistCache(){const body=JSON.stringify(mediaCache,null,2);writes=writes.then(()=>fs.writeFile('work/play-crawler/media-cache.json',body));return writes;}
async function media(sourceUrl,size){
 if(!sourceUrl)return null;
 const base=new URL(sourceUrl);if(base.protocol!=='https:'||!base.hostname.endsWith('.googleusercontent.com'))throw new Error('Unexpected image origin');
 const url=sourceUrl.replace(/=[^/]*$/,'')+`=w${size}`;
 if(mediaCache[url]&&await fs.access('public'+mediaCache[url].localPath).then(()=>true,()=>false))return mediaCache[url];
 for(let attempt=0;attempt<2;attempt++){
  try{const response=await fetch(url,{signal:AbortSignal.timeout(25000)});if(!response.ok)throw new Error(`HTTP ${response.status}`);const mime=response.headers.get('content-type')?.split(';')[0];const ext={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mime];if(!ext)throw new Error('Unexpected image type '+mime);const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<100)throw new Error('Empty image');const filename=createHash('sha256').update(url).digest('hex').slice(0,20)+'.'+ext;await fs.writeFile('public/play-media/'+filename,bytes);mediaCache[url]={sourceUrl:url,listingSourceUrl:sourceUrl,localPath:'/play-media/'+filename,mimeType:mime,bytes:bytes.length};await persistCache();return mediaCache[url];}catch(e){if(attempt===1){mediaErrors.push({sourceUrl:url,error:e.message});return null;}}
 }
}
const accepted=Object.values(snapshots).filter(a=>eligibility(a)==='included'&&!originals.has(a.appId)).sort((a,b)=>Date.parse(b.released)-Date.parse(a.released)||a.title.localeCompare(b.title));
const imported=[],details={};let index=0,done=0;
await Promise.all(Array.from({length:3},async()=>{while(index<accepted.length){const a=accepted[index++],g=buildGame(a);const icon=await media(a.icon,128),screenshots=[];screenshots.push(...allScreenshots(a.screenshots||[],Object.values(mediaCache)));details[g.id]={id:g.id,url:g.sourceUrl,fetchedAt:g.fetchedAt,rating:typeof a.score==='number'&&a.score>0?a.score:null,ratingCount:typeof a.ratings==='number'?a.ratings:null,reviews:[],reviewStatus:'not-collected',screenshots,icon};imported.push(g);done++;if(done%20===0)console.log('Imported',done,'/',accepted.length,'image failures',mediaErrors.length);}}));
await writes;
imported.sort((a,b)=>b.releasedAt.localeCompare(a.releasedAt)||a.title.localeCompare(b.title));
const audit=Object.values(candidates).map(c=>{const a=snapshots[c.id];return {id:c.id,title:a?.title||c.title,decision:a?originals.has(c.id)?'existing-curated':eligibility(a):'fetch-failed',released:a?.released||null,genre:a?.genre||null,genreId:a?.genreId||null,url:a?.url||`https://play.google.com/store/apps/details?id=${encodeURIComponent(c.id)}&hl=en&gl=US`,discoveredVia:c.discoveredVia,...(!a?{error:failures[c.id]?.message||'Not fetched'}:{})};});
const decisions={};for(const a of audit)decisions[a.decision]=(decisions[a.decision]||0)+1;
const coverage={...WINDOW,candidates:audit.length,checked:Object.keys(snapshots).length,included:imported.length,retainedOriginals:originals.size,decisions,discoveryQueries:discovery.filter(x=>!x.error).length,completedAt:new Date().toISOString(),imageFailures:mediaErrors.length,exhaustive:false,method:'US-English public Google Play Strategy charts, keyword searches, recommendation links and developer catalogs; first release from Released on, not Updated on. Search and chart results are capped by Google Play. No claim of complete coverage.'};
// Stage all generated metadata before publishing. Network failure cannot erase the curated catalog.
const files={'src/data/recent-details.json':details,'src/data/recent-games.json':imported,'src/data/scan-coverage.json':coverage,'data/google-play/recent-scan-audit.json':{coverage,discovery,candidates:audit,mediaErrors},'data/google-play/recent-listing-evidence.json':Object.fromEntries(accepted.map(({description,...facts})=>[facts.appId,facts]))};
for(const [file,data] of Object.entries(files))await fs.writeFile(file+'.tmp',JSON.stringify(data,null,2)+'\n');
for(const file of Object.keys(files))await fs.rename(file+'.tmp',file);
console.log(JSON.stringify(coverage,null,2));
