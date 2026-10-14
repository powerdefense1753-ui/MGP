import fs from 'node:fs/promises';
import gplay from 'google-play-scraper';
import {allScreenshots} from './play-screenshots.mjs';
const read=async p=>JSON.parse(await fs.readFile(p,'utf8'));
// Run only while the graph worker is stopped, to avoid publishing competing metadata.
try { await fs.access('work/play-crawler/graph.lock'); throw new Error('Stop the graph worker before syncing screenshots'); }
catch(e) { if(e.code!=='ENOENT') throw e; }
const curated=await read('src/data/play-details.json');
const recent=await read('src/data/recent-details.json');
const snapshots=await read('work/play-crawler/snapshots.json');
const evidence={};
for(const [id,d] of Object.entries(curated)) {
 const a=await gplay.app({appId:id,lang:'en',country:'us',requestOptions:{timeout:{request:20000},retry:{limit:0}}});
 d.screenshots=allScreenshots(a.screenshots,d.screenshots);
 evidence[id]={url:d.url,fetchedAt:new Date().toISOString(),screenshots:a.screenshots};
 console.log(id,d.screenshots.length);
}
for(const [id,d] of Object.entries(recent)) {
 const a=snapshots[id];
 if(!a || !Array.isArray(a.screenshots)) throw new Error('Missing listing screenshot evidence: '+id);
 d.screenshots=allScreenshots(a.screenshots,d.screenshots);
 evidence[id]={url:a.url,fetchedAt:a.fetchedAt,screenshots:a.screenshots};
}
const files={'src/data/play-details.json':curated,'src/data/recent-details.json':recent,'data/google-play/screenshot-evidence.json':evidence};
for(const [p,data] of Object.entries(files)) await fs.writeFile(p+'.tmp',JSON.stringify(data,null,2)+'\n');
for(const p of Object.keys(files)) await fs.rename(p+'.tmp',p);
console.log(JSON.stringify({games:Object.keys(evidence).length,screenshots:Object.values({...curated,...recent}).reduce((sum,d)=>sum+d.screenshots.length,0)}));
