// Resumable expansion of the publicly discoverable US-English strategy-game graph.
import fs from 'node:fs/promises';
import {spawn} from 'node:child_process';
import gplay from 'google-play-scraper';
import {eligibility,WINDOW} from './play-import.mjs';
import {listingLinks,queueTask,pickTasks,developerKey} from './play-frontier.mjs';
const dir='work/play-crawler';await fs.mkdir(dir,{recursive:true});
const read=async(p,fallback)=>JSON.parse(await fs.readFile(p,'utf8').catch(e=>{if(e.code==='ENOENT')return JSON.stringify(fallback);throw e;}));
const atomic=async(p,value)=>{await fs.writeFile(p+'.tmp',JSON.stringify(value,null,2));await fs.rename(p+'.tmp',p);};
const lock=dir+'/graph.lock';
const old=await read(lock,null);if(old){let alive=false;try{process.kill(old.pid,0);alive=true;}catch{}if(alive)throw new Error('Another crawler already owns the queue: '+old.pid);await fs.unlink(lock);}
await fs.writeFile(lock,JSON.stringify({pid:process.pid,startedAt:new Date().toISOString()}),{flag:'wx'});
const candidates=await read(dir+'/candidates.json',{}),snapshots=await read(dir+'/snapshots.json',{}),failures=await read(dir+'/failures.json',{}),discovery=await read(dir+'/discovery.json',[]);
const state=await read(dir+'/graph-state.json',{tasks:{},completed:0,batches:0});
for(const t of Object.values(state.tasks))if(t.status==='running')t.status='pending';
const originalIds=new Set((await read('src/data/google-play.json',[])).map(g=>g.id));
const fields=['appId','title','description','summary','installs','minInstalls','score','ratings','price','free','currency','priceText','offersIAP','adSupported','developer','developerId','developerInternalID','genre','genreId','categories','icon','screenshots','released','updated','preregister','earlyAccessEnabled'];
for(const a of Object.values(snapshots).sort((a,b)=>Number(eligibility(b)==='included')-Number(eligibility(a)==='included')))if(a.genreId==='GAME_STRATEGY')queueTask(state.tasks,'expand',a.appId,'existing-strategy');
for(const a of Object.values(snapshots))if(a.genreId==='GAME_STRATEGY'&&developerKey(a))queueTask(state.tasks,'developer',developerKey(a),'verified-developer:'+a.appId);
for(const id of Object.keys(candidates))if(!snapshots[id])queueTask(state.tasks,'app',id,'unverified-candidate');
const extras=['strategy games indie 2026','new tactical RPG strategy','turn-based war 2025','turn-based war 2026','offline RTS 2025','offline RTS 2026','tower defense 2024','tower defense 2025','tower defense 2026','city building 2025','city building 2026','strategy base defense','strategy island','strategy colony','strategy kingdom offline','tactical roguelite','hex strategy','hex war','strategy train','strategy space fleet','strategy naval fleet','strategy card battle','strategy dungeon defense','strategy ants','strategy insects','strategy dinosaur','strategy robots','strategy medieval offline','strategy world conquest','strategy empire builder','策略游戏','战略游戏','即时战略','回合制策略','塔防游戏','三国策略','ストラテジーゲーム','戦略ゲーム','전략 게임','전략 시뮬레이션','jeux de stratégie','juegos de estrategia','jogos de estratégia','Strategie Spiele','стратегические игры','permainan strategi','game strategi'];
for(const term of extras)queueTask(state.tasks,'search',term,'expanded-terms');
let phase='starting',lastPublished=(await read('src/data/scan-coverage.json',{})).included||0,halt=false;
const qualified=()=>Object.values(snapshots).filter(a=>eligibility(a)==='included'&&!originalIds.has(a.appId)).length;
const counts=()=>{const c={};for(const t of Object.values(state.tasks))c[t.status]=(c[t.status]||0)+1;return c;};
async function status(extra={}){await atomic(dir+'/graph-status.json',{pid:process.pid,phase,updatedAt:new Date().toISOString(),window:WINDOW,candidates:Object.keys(candidates).length,checked:Object.keys(snapshots).length,qualified:qualified(),published:lastPublished,queue:counts(),completed:state.completed,batches:state.batches,exhaustive:false,...extra});}
async function checkpoint(){await atomic(dir+'/candidates.json',candidates);await atomic(dir+'/snapshots.json',snapshots);await atomic(dir+'/failures.json',failures);await atomic(dir+'/discovery.json',discovery);await atomic(dir+'/graph-state.json',state);await status();}
function add(app,via){const id=typeof app==='string'?app:app.appId;if(!id)return;candidates[id]??={id,title:app.title||id,discoveredVia:[]};if(!candidates[id].discoveredVia.includes(via))candidates[id].discoveredVia.push(via);if(!snapshots[id])queueTask(state.tasks,'app',id,via);}
const options={lang:'en',country:'us',requestOptions:{timeout:{request:20000},retry:{limit:0}}};
async function execute(task){
 task.status='running';task.attempts++;
 try{
  let apps=[];
  if(task.kind==='app'||task.kind==='expand'){
   let html='';const a=await gplay.app({...options,appId:task.id,requestOptions:{...options.requestOptions,hooks:{afterResponse:[r=>{html=r.body;return r;}]}}});
   if(!a.title||!a.genreId)throw new Error('Listing schema is missing title or category');
   snapshots[task.id]={...Object.fromEntries(fields.map(k=>[k,a[k]??null])),url:`https://play.google.com/store/apps/details?id=${encodeURIComponent(task.id)}&hl=en&gl=US`,fetchedAt:new Date().toISOString()};delete failures[task.id];
   if(a.genreId==='GAME_STRATEGY'){
    apps=listingLinks(html).filter(id=>id!==task.id);for(const id of apps)add(id,'related:'+task.id);
    const dev=developerKey(a);if(dev)queueTask(state.tasks,'developer',dev,'developer-of:'+task.id);
    const expand=queueTask(state.tasks,'expand',task.id,task.via);expand.status='done';expand.finishedAt=new Date().toISOString();
   }
  }else if(task.kind==='developer'){
   apps=await gplay.developer({...options,devId:task.id,num:10000});for(const a of apps)add(a,'developer:'+task.id);
  }else if(task.kind==='search'){
   apps=await gplay.search({...options,term:task.id,num:250});for(const a of apps)add(a,'search:'+task.id);
  }
  task.status='done';task.resultCount=apps.length;task.finishedAt=new Date().toISOString();delete task.error;
  discovery.push({key:JSON.stringify({type:task.kind,id:task.id}),count:apps.length,fetchedAt:task.finishedAt});state.completed++;
 }catch(e){
  task.error=e.message;task.failedAt=new Date().toISOString();
  if(task.kind==='app')failures[task.id]={message:e.message,at:task.failedAt};
  if(e.status===404||/not found \(404\)/i.test(e.message))task.status='unavailable';
  else if(task.attempts>=3)task.status='failed';
  else{task.status='pending';task.notBefore=Date.now()+60000*task.attempts;}
  if(e.status===429||/429|403/.test(e.message))state.pauseUntil=Date.now()+15*60*1000;
  console.log('TASK ERROR',task.kind,task.id,task.attempts,e.message);
 }
}
const run=(file,args=[])=>new Promise((resolve,reject)=>{const p=spawn(process.execPath,[file,...args],{stdio:'inherit',windowsHide:true});p.on('error',reject);p.on('exit',code=>code===0?resolve():reject(new Error(file+' exited '+code)));});
async function publish(){
 phase='publishing';await checkpoint();
 const files=['src/data/recent-games.json','src/data/recent-details.json','src/data/scan-coverage.json','data/google-play/recent-scan-audit.json','data/google-play/recent-listing-evidence.json','src/data/content-translations.json'];
 const backups=await Promise.all(files.map(f=>fs.readFile(f)));
 // Content translation is a separate, optional job; collection publishes source text first.
 try{await run('scripts/import-recent-games.mjs');await run('--test',['src/discovery.test.js','scripts/play-import.test.mjs','scripts/play-frontier.test.mjs','src/i18n.test.js','src/content-i18n.test.js']);lastPublished=(await read('src/data/scan-coverage.json',{})).included;console.log('PUBLISHED',lastPublished);}
 catch(e){for(let i=0;i<files.length;i++)await fs.writeFile(files[i],backups[i]);phase='validation_failed';halt=true;await status({error:e.message});throw e;}
 phase='crawling';await status();
}
try{
 phase='crawling';await checkpoint();
 while(!halt){
  const disk=await fs.statfs('.');if(disk.bavail*disk.bsize<2*1024**3){phase='storage_blocked';await status({error:'Less than 2 GiB free disk space'});break;}
  if(await fs.access(dir+'/graph.stop').then(()=>true,()=>false)){phase='stopped_by_request';break;}
  if(state.pauseUntil>Date.now()){phase='rate_limit_backoff';await status({retryAt:new Date(state.pauseUntil).toISOString()});await new Promise(r=>setTimeout(r,10000));continue;}
  const tasks=pickTasks(state.tasks,3);
  if(!tasks.length){
   if(Object.values(state.tasks).some(t=>t.status==='pending')){await status();await new Promise(r=>setTimeout(r,10000));continue;}
   if(qualified()>lastPublished)await publish();phase='frontier_exhausted_not_all';await checkpoint();break;
  }
  phase='crawling';await Promise.all(tasks.map(execute));state.batches++;await checkpoint();
  if(state.batches%10===0)console.log('PROGRESS',JSON.stringify({candidates:Object.keys(candidates).length,checked:Object.keys(snapshots).length,qualified:qualified(),published:lastPublished,queue:counts()}));
  if(qualified()>=lastPublished+25)await publish();
  await new Promise(r=>setTimeout(r,500));
 }
 await checkpoint();
}catch(e){if(phase!=='validation_failed')phase='error';await status({error:e.stack});console.error(e);process.exitCode=1;}
finally{await fs.unlink(lock).catch(()=>{});}
