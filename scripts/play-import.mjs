// Import only verifiable listing facts. Unknown values remain null.
export const WINDOW={from:'2024-10-12',to:'2026-10-12',country:'US',language:'en'};
export function releaseDate(value){
 if(typeof value!=='string')return null;
 const match=value.match(/^([A-Za-z]{3}) (\d{1,2}), (\d{4})$/);
 if(!match)return null;
 const month=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].indexOf(match[1]);
 if(month<0)return null;
 const date=new Date(Date.UTC(+match[3],month,+match[2]));
 return date.getUTCMonth()===month&&date.getUTCDate()===+match[2]?date.toISOString().slice(0,10):null;
}
export function eligibility(app,window=WINDOW){
 if(app.genreId!=='GAME_STRATEGY')return 'not-strategy';
 if(app.preregister)return 'preregistration';
 const date=releaseDate(app.released);
 if(!date)return 'unknown-release';
 return date>=window.from&&date<=window.to?'included':'outside-window';
}
const categoryTags={'Fantasy':'Fantasy','Medieval':'Medieval','Medieval fantasy':['Medieval','Fantasy'],'Ancient china':['Ancient','Chinese'],'Three kingdoms':['Ancient','Chinese'],'Ancient rome':['Ancient','Roman'],'Modern':'Modern','Space':'Space','Wargame':'Warfare','Military':'Warfare','Tower defense':'Tower defense','Turn-based strategy':'Turn-based','Turn-based':'Turn-based','Real-time strategy':'Real-time','Real-time':'Real-time','4X':'4X','Tactics':'Tactics','City-building':'City builder','City building':'City builder','Grand strategy':'Grand strategy','Offline':'Offline','Single player':'Single player','Multiplayer':'Multiplayer','Realistic':'Realistic','Stylized':'Stylized','Abstract':'Abstract','Cartoon':'Cartoon'};
const plain=s=>s.replaceAll('&amp;','&').replaceAll('&quot;','\"').replaceAll('&#39;',"'").replaceAll('&lt;','<').replaceAll('&gt;','>');
export function buildGame(a){
 const evidence=[];
 for(const category of a.categories||[]){const mapping=categoryTags[category.name];for(const tag of mapping?[mapping].flat():[]){if(!evidence.some(e=>e.tag===tag))evidence.push({tag,basis:'Google Play category label mapping',excerpt:category.name});}}
 const summaryPatterns=[['Turn-based',/turn[ -]based/i],['Real-time',/real[ -]time|\bRTS\b/i],['Tower defense',/tower defen[cs]e|\bTD\b/i],['Grand strategy',/grand strategy/i],['4X',/\b4x\b/i],['City builder',/city[ -]build/i],['Economic strategy',/economic strategy/i]];
 for(const [tag,re] of summaryPatterns){if(re.test(a.summary||'')&&!/\b(no|not|without)\b/i.test(a.summary)&&!evidence.some(e=>e.tag===tag))evidence.push({tag,basis:'Developer summary keyword mapping',excerpt:a.summary});}
 const price=typeof a.price==='number'&&Number.isFinite(a.price)?a.price:null;
 if(price!==null&&a.currency)evidence.push({tag:price>0?'Paid download':'Free download',basis:'Google Play price',excerpt:`${a.currency} ${price}`});
 evidence.push({tag:'Android',basis:'Google Play platform',excerpt:'Android'});
 // A scraper's false boolean can be an absent label: do not infer an explicit absence.
 if(a.adSupported===true)evidence.push({tag:'Contains ads',basis:'Google Play label',excerpt:'Contains ads'});
 if(a.offersIAP===true)evidence.push({tag:'In-app purchases',basis:'Google Play label',excerpt:'In-app purchases'});
 const tags=evidence.map(e=>e.tag),genre=tags.find(x=>['Tower defense','Turn-based','Real-time','4X','Tactics','City builder','Grand strategy'].includes(x))||'Strategy';
 return {id:a.appId,title:a.title,subtitle:plain(a.summary||''),description:plain(a.summary||(a.description||'').split(/\s+/).slice(0,25).join(' ')),overviewEn:plain(a.summary||''),genre,world:'',tags,evidence,price:price===null?null:price>0?'Paid download':'Free download',priceValue:price,priceCurrency:a.currency||null,priceDisplay:price===null?'Price unavailable':price===0?'Free download':`${a.currency==='USD'?'US$':a.currency+' '}${price.toFixed(2)}`,developer:a.developer||'Not listed',ads:a.adSupported===true?true:null,inAppPurchases:a.offersIAP===true?true:null,duration:null,depth:null,sourceUrl:a.url,fetchedAt:a.fetchedAt,sourceDate:a.fetchedAt.slice(0,10),region:'US',language:'English',releasedAt:releaseDate(a.released),releaseEvidence:{basis:'Google Play Released on',value:a.released,url:a.url},catalog:'recent',note:'Official Google Play strategy category. Release date is the listing’s Released on value; no independent playtest or review synthesis.',iconSourceUrl:a.icon};
}
