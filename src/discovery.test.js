import {statSync} from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import {discover,games,groups} from './discovery.js';
const rome='com.feralinteractive.rometw';
test('all hard conditions apply together and documented exclusions are removed',()=>{
 const r=discover(games,{filters:{'Turn-based':'must','Offline':'must','Roman':'avoid'}});
 assert.ok(r.length>0);assert.ok(r.every(g=>g.tags.includes('Turn-based')&&g.tags.includes('Offline')&&!g.tags.includes('Roman')));
});
test('preferences rank matches without excluding alternatives',()=>{
 const r=discover(games,{filters:{'Chinese':'prefer'}});
 assert.equal(r.length,games.length);assert.equal(r[0].id,'com.longyoug.hmby');assert.deepEqual(r[0].matches,['Chinese']);assert.ok(r.at(-1).missing.includes('Chinese'));
});
test('unsupported hard combinations remain empty',()=>{assert.equal(discover(games,{filters:{'Roman':'must','Chinese':'must'}}).length,0)});
test('search combines terms and collection restrictions',()=>{
 assert.deepEqual(discover(games,{query:'  ROME   ancient ',savedOnly:true,saved:[rome,'com.longyoug.hmby']}).map(g=>g.id),[rome]);
 assert.equal(discover(games,{savedOnly:true,saved:[]}).length,0);
});
test('unknown price sorts after known prices',()=>{
 const fixture=[{id:'unknown',title:'unknown',tags:[]},{id:'paid',title:'paid',tags:[],priceValue:5},{id:'free',title:'free',tags:[],priceValue:0}];
 assert.deepEqual(discover(fixture,{sort:'price'}).map(g=>g.id),['free','paid','unknown']);
});
test('all imported games have provenance and every filterable tag has evidence',()=>{
 const knownTags=new Set(groups.flatMap(g=>g.tags));assert.ok(games.length>=11);assert.equal(new Set(games.map(g=>g.id)).size,games.length);
 for(const g of games){
  const url=new URL(g.sourceUrl);assert.equal(url.hostname,'play.google.com');assert.equal(url.searchParams.get('id'),g.id);assert.equal(url.searchParams.get('gl'),'US');assert.equal(url.searchParams.get('hl'),'en');
  assert.ok(Number.isFinite(Date.parse(g.fetchedAt)));assert.ok(g.developer);assert.ok(g.priceValue===null||g.priceValue>=0);assert.ok(g.priceCurrency===null||g.priceCurrency==='USD');assert.equal(g.duration,null);assert.equal(g.depth,null);
  assert.ok(g.tags.every(t=>knownTags.has(t)&&g.evidence.some(e=>e.tag===t&&e.excerpt)));
 }
});
test('missing ads/IAP labels do not imply ad-free or purchase-free',()=>{
 const mindustry=games.find(g=>g.id==='io.anuke.mindustry');assert.equal(mindustry.ads,null);assert.equal(mindustry.inAppPurchases,null);assert.ok(!mindustry.tags.includes('No ads'));
 const northgard=games.find(g=>g.id==='com.playdigious.northgard');assert.equal(northgard.inAppPurchases,true);assert.ok(northgard.priceValue>0);assert.ok(!northgard.tags.includes('Offline'));
 assert.equal(games.find(g=>g.id==='com.unciv.app').ads,false);
 assert.equal(games.find(g=>g.id==='com.ironhidegames.android.kingdomrush').ads,true);
});

import {details as playDetails,coverage} from './catalog.js';
import reviewSummaries from './data/review-summaries.json' with {type:'json'};
test('real rating, screenshots and review summaries have complete aligned provenance',()=>{
 for(const g of games.filter(g=>g.catalog!=='recent')){
  const d=playDetails[g.id],s=reviewSummaries[g.id];assert.ok(d);assert.ok(d.rating>=0&&d.rating<=5);assert.ok(d.ratingCount>0);assert.equal(d.reviews.length,3);assert.ok(d.screenshots.length>=2);
  assert.deepEqual(s.sampleIds,d.reviews.map(r=>r.id));
  for(const kind of ['positive','caution']){assert.ok(s[kind].zh&&s[kind].en);assert.ok(s[kind].reviewIds.every(id=>s.sampleIds.includes(id)))}
  for(const im of [d.icon,...d.screenshots]){assert.equal(new URL(im.sourceUrl).hostname,'play-lh.googleusercontent.com');if(im.storage==='remote'){assert.equal(new URL(im.displayUrl).hostname,'play-lh.googleusercontent.com')}else{assert.match(im.localPath,/^\/play-media\//);assert.ok(im.bytes>1000);assert.match(im.mimeType,/^image\//)}}
  for(const r of d.reviews){assert.ok(r.date);assert.ok(r.excerpt);assert.equal(r.text,undefined);assert.ok(r.excerpt.split(/\s+/).length<=35)}
 }
});

test('recent-only selection and release sorting use verified release dates',()=>{
 const fixtures=[{id:'legacy',title:'Legacy',tags:[]},{id:'older',title:'Older',tags:[],catalog:'recent',releasedAt:'2024-10-12'},{id:'newest',title:'Newest',tags:[],catalog:'recent',releasedAt:'2026-10-12'}];
 assert.deepEqual(discover(fixtures,{recentOnly:true,sort:'release'}).map(g=>g.id),['newest','older']);
});
test('imported recent listings meet the agreed window and do not invent reviews',()=>{
 const recent=games.filter(g=>g.catalog==='recent'&&g.categories.includes('strategy')); assert.ok(recent.length>0);assert.equal(recent.length,coverage.included);assert.equal(games.filter(g=>g.categories.includes('strategy')).length,11+coverage.included);
 for(const g of recent){assert.ok(g.releasedAt>=coverage.from&&g.releasedAt<=coverage.to);assert.ok(g.releaseEvidence.value);const d=playDetails[g.id];assert.ok(d);assert.equal(d.reviews.length,0);assert.equal(d.reviewStatus,'not-collected');assert.ok(d.rating===null||(d.rating>0&&d.rating<=5));for(const im of [d.icon,...d.screenshots].filter(Boolean)){assert.ok(new URL(im.sourceUrl).hostname.endsWith('.googleusercontent.com'));if(im.storage==='remote'){assert.equal(new URL(im.displayUrl).protocol,'https:');assert.equal(new URL(im.displayUrl).hostname,new URL(im.sourceUrl).hostname)}else{assert.ok(im.bytes>100);assert.equal(statSync(new URL('../public'+im.localPath,import.meta.url)).size,im.bytes);}}}
});
