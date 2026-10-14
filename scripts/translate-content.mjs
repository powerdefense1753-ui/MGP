import fs from 'node:fs/promises';
import {setTimeout as delay} from 'node:timers/promises';
const read=async(p,fallback)=>JSON.parse(await fs.readFile(p,'utf8').catch(e=>{if(e.code==='ENOENT'&&fallback!==undefined)return JSON.stringify(fallback);throw e;}));
const games=[...await read('src/data/google-play.json'),...await read('src/data/recent-games.json')];
const summaries=await read('src/data/review-summaries.json');
const details={...await read('src/data/recent-details.json'),...await read('src/data/play-details.json')};
const texts=[...new Set(games.flatMap(g=>[g.overviewEn||g.description,...['positive','caution'].map(k=>summaries[g.id]?.[k]?.en),...(details[g.id]?.reviews||[]).map(r=>r.excerpt)]).filter(Boolean))];
const targets={'zh-Hans':'zh-CN','zh-Hant':'zh-TW',ja:'ja',es:'es',fr:'fr',de:'de',pt:'pt',th:'th',id:'id'};
const cachePath='work/content-translation-cache.json';
const cache=await read(cachePath,{});
await fs.mkdir('work',{recursive:true});
async function requestTranslation(input,target){
 const url=new URL('https://translate.googleapis.com/translate_a/single');
 for(const [key,value] of Object.entries({client:'gtx',sl:'en',tl:target,dt:'t',q:input}))url.searchParams.set(key,value);
 const response=await fetch(url,{signal:AbortSignal.timeout(45000)});
 if([403,429].includes(response.status))throw Object.assign(new Error(`Translation access/rate limit: HTTP ${response.status}; stopped without bypass`),{blocked:true});
 if(!response.ok)throw new Error('Translation HTTP '+response.status);
 const data=await response.json();const output=data[0].map(part=>part[0]||'').join('');
 if(!output.trim())throw new Error('Empty translation');
 return output;
}
for(const [locale,target] of Object.entries(targets)){
 const dictionary=cache[locale]??={};
 const missing=texts.filter(text=>!dictionary[text]);
 const batches=[];let batch=[],length=0;
 for(const text of missing){if(batch.length&&length+text.length>2400){batches.push(batch);batch=[];length=0}batch.push(text);length+=text.length+30}if(batch.length)batches.push(batch);
 for(const [batchIndex,items] of batches.entries()){
  const input=items.map((text,i)=>`[${900000+i}]\n${text}`).join('\n\n');
  let translated;
  for(let attempt=0;attempt<3;attempt++){
   try{
    const output=await requestTranslation(input,target);
    const matches=[...output.matchAll(/\[(900\d{3})\]\s*([\s\S]*?)(?=\[900\d{3}\]|$)/g)];
    if(matches.length!==items.length||matches.some((m,i)=>Number(m[1])!==900000+i||!m[2].trim())){
     console.log(`${locale}: batch markers changed; translating ${items.length} items separately`);
     translated=[];
     for(const text of items){translated.push((await requestTranslation(text,target)).trim());await delay(500);}
    }else translated=matches.map(m=>m[2].trim());
    break;
   }catch(e){if(e.blocked||attempt===2)throw e;await delay(2000*(attempt+1));}
  }
  items.forEach((text,i)=>dictionary[text]=translated[i]);
  await fs.writeFile(cachePath+'.tmp',JSON.stringify(cache));await fs.rename(cachePath+'.tmp',cachePath);
  console.log(`${locale}: ${batchIndex+1}/${batches.length} batches; ${texts.filter(t=>dictionary[t]).length}/${texts.length} texts`);
  await delay(500);
 }
}
const translations=Object.fromEntries(Object.keys(targets).map(locale=>[locale,Object.fromEntries(texts.map(text=>[text,cache[locale][text]]))]));
const artifact={provider:'Google Translate',method:'machine-translation',sourceLanguage:'en',updatedAt:new Date().toISOString(),games:games.length,sourceTexts:texts.length,translations};
await fs.writeFile('src/data/content-translations.json.tmp',JSON.stringify(artifact,null,2)+'\n');
await fs.rename('src/data/content-translations.json.tmp','src/data/content-translations.json');
console.log(`PUBLISHED translations: ${games.length} games, ${texts.length} texts, ${Object.keys(targets).length} target languages`);
