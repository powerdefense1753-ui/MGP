import test from 'node:test';
import assert from 'node:assert/strict';
import {localizeContent} from './content-i18n.js';
import {readFileSync} from 'node:fs';
test('content translation uses exact source text and retains the original',()=>{
 const dictionary={ja:{'Build a city.':'都市を建設。'}};
 assert.deepEqual(localizeContent('Build a city.','ja',dictionary),{text:'都市を建設。',original:'Build a city.',method:'machine',translated:true});
 assert.equal(localizeContent('Build a different city.','ja',dictionary).method,'unavailable');
 assert.equal(localizeContent('Build a city.','en',dictionary).text,'Build a city.');
});
test('reviewed translation takes precedence; missing reviews stay empty',()=>{
 const result=localizeContent('Build.','zh-Hans',{'zh-Hans':{'Build.':'构建。'}},'建设。');
 assert.equal(result.method,'reviewed');assert.equal(result.text,'建设。');
 assert.equal(localizeContent('','ja',{}).text,'');
});
test('published content uses existing translations or explicitly falls back to its source',()=>{
 const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
 const games=[...read('./data/google-play.json'),...read('./data/recent-games.json')];
 const details={...read('./data/recent-details.json'),...read('./data/play-details.json')};
 const summaries=read('./data/review-summaries.json');
 const data=read('./data/content-translations.json');
 assert.equal(data.sourceLanguage,'en');assert.equal(data.method,'machine-translation');
 for(const game of games){
  const texts=[game.overviewEn||game.description,...['positive','caution'].map(k=>summaries[game.id]?.[k]?.en),...details[game.id].reviews.map(r=>r.excerpt)].filter(Boolean);
  for(const locale of ['zh-Hans','zh-Hant','ja','es','fr','de','pt','th','id'])for(const text of texts){
   const translated=data.translations[locale]?.[text];
   const result=localizeContent(text,locale,data.translations);
   if(translated!==undefined){assert.ok(translated.trim(),game.id+' '+locale);assert.doesNotMatch(translated,/\[(?:MGP_\d+|900\d{3})\]/);assert.equal(result.text,translated);assert.equal(result.method,'machine');}
   else{assert.equal(result.text,text);assert.equal(result.original,text);assert.equal(result.method,'unavailable');assert.equal(result.translated,false);}
  }
 }
});
