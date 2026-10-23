import test from 'node:test';
import assert from 'node:assert/strict';
import {releaseDate, eligibility, buildGame, collectionWindow} from './play-import.mjs';
const base={appId:'sample.game',title:'Sample',developer:'Studio',genreId:'GAME_STRATEGY',released:'Oct 12, 2024',price:0,currency:'USD',summary:'Plan your defense',description:'Build your settlement.',categories:[{name:'Strategy'},{name:'Tower defense'},{name:'Offline'}],fetchedAt:'2026-10-12T08:00:00Z',url:'https://play.google.com/store/apps/details?id=sample.game&hl=en&gl=US'};
test('first release boundaries are inclusive and updates cannot qualify an old game',()=>{
 assert.equal(releaseDate('Oct 12, 2024'),'2024-10-12');
 assert.equal(eligibility(base),'included');
 assert.equal(eligibility({...base,released:'Oct 11, 2024',updated:Date.parse('2026-10-12')}),'outside-window');
 assert.equal(eligibility({...base,released:'Oct 12, 2026'}),'included');
 assert.equal(eligibility({...base,released:'Oct 13, 2026'},{from:'2024-10-12',to:'2026-10-12'}),'outside-window');
 assert.equal(eligibility({...base,released:null}),'unknown-release');
 assert.equal(releaseDate('Feb 30, 2025'),null);
});
test('only published strategy listings qualify, excluding preregistration and other genres',()=>{
 assert.equal(eligibility({...base,preregister:true}),'preregistration');
 assert.equal(eligibility({...base,genreId:'GAME_PUZZLE'}),'not-strategy');
});
test('source-backed tags and payment labels preserve unknown facts',()=>{
 const g=buildGame(base);
 assert.equal(g.releasedAt,'2024-10-12');assert.equal(g.ads,null);assert.equal(g.inAppPurchases,null);
 assert.ok(g.tags.includes('Tower defense'));assert.ok(g.tags.includes('Offline'));
 assert.ok(!g.tags.includes('No ads'));assert.ok(!g.tags.includes('No microtransactions'));
 assert.ok(g.tags.every(tag=>g.evidence.some(e=>e.tag===tag&&e.excerpt)));
 assert.equal(buildGame({...base,price:undefined,currency:undefined}).priceValue,null);
});

import {allScreenshots} from './play-screenshots.mjs';
test('complete screenshots preserve order, deduplicate sizes and retain cached files',()=>{
 const urls=Array.from({length:26},(_,i)=>'https://play-lh.googleusercontent.com/shot'+i);
 const cached={sourceUrl:urls[0]+'=w640',localPath:'/play-media/existing.png'};
 const result=allScreenshots([...urls,urls[0]+'=w320'],[cached]);
 assert.equal(result.length,26);assert.equal(result[0],cached);assert.equal(result[25].sourceUrl,urls[25]);assert.equal(result[25].storage,'remote');assert.throws(()=>allScreenshots(['https://example.com/image']));
});

test('rolling cutoff follows Shanghai midnight and excludes future releases',()=>{const before=collectionWindow(new Date('2026-10-22T15:59:59Z')),after=collectionWindow(new Date('2026-10-22T16:00:00Z'));assert.equal(before.to,'2026-10-22');assert.equal(after.to,'2026-10-23');assert.equal(eligibility({...base,released:'Oct 23, 2026'},after),'included');assert.equal(eligibility({...base,released:'Oct 24, 2026'},after),'outside-window');});
