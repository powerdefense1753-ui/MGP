import {games as realGames} from './catalog.js';
export const groups = [
  {id:'gameplay',name:'Play style',tags:['Turn-based','Real-time','City builder','Tactics','4X','Tower defense','Grand strategy','Economic strategy']},
  {id:'era',name:'Era',tags:['Ancient','Medieval','Modern','Future','Fantasy']},
  {id:'culture',name:'World & culture',tags:['Roman','Chinese','Japanese','Nordic','Space']},
  {id:'theme',name:'Theme',tags:['Warfare','Politics','Trade','Survival','Nature']},
  {id:'art',name:'Art direction',tags:['Illustrated','Cartoon','Low poly','Stylized','Abstract','Realistic']},
  {id:'experience',name:'Fits your day',tags:['Offline','Single player','Multiplayer']},
  {id:'price',name:'Payment',tags:['Paid download','Free download','Free demo','No ads','No microtransactions','Contains ads','In-app purchases']},
  {id:'platform',name:'Platform',tags:['Android']},
];
groups.push({id:'combination',name:'Gameplay combination',tags:['Pure gameplay','+ Building','+ Renovation','+ Dress-up','+ Management','+ Story','+ Combat','+ Exploration','+ Collection & raising']},{id:'casual-mechanics',name:'Play style',tags:['Runner','Stacking','Sorting','Physics puzzle','Tap gameplay','Match-3','Triple matching','Bubble shooter','Merge-2','Merge-3','Number merge']});
export const games = realGames;
export function discover(catalog,{query='',filters={},sort='release',savedOnly=false,saved=[],recentOnly=false,minRating=0,minDownloads=0,metrics={}}={}){
 const must=Object.keys(filters).filter(t=>filters[t]==='must');
 const avoid=Object.keys(filters).filter(t=>filters[t]==='avoid');
 const prefer=Object.keys(filters).filter(t=>filters[t]==='prefer');
 const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 return catalog.filter(g=>(!minRating||(Number.isFinite(metrics[g.id]?.rating)&&metrics[g.id].rating>=minRating))&&(!minDownloads||(Number.isFinite(g.minInstalls)&&g.minInstalls>=minDownloads))&&(!recentOnly||g.catalog==='recent')&&(!savedOnly||saved.includes(g.id))&&must.every(t=>g.tags.includes(t))&&avoid.every(t=>!g.tags.includes(t))&&words.every(w=>`${g.title} ${g.developer||''} ${g.subtitle} ${g.world} ${g.tags.join(' ')}`.toLowerCase().includes(w)))
 .map(g=>({...g,matches:prefer.filter(t=>g.tags.includes(t)),missing:prefer.filter(t=>!g.tags.includes(t))}))
 .sort((a,b)=>sort==='rating'?(metrics[b.id]?.rating??-1)-(metrics[a.id]?.rating??-1):sort==='release-asc'?(!a.releasedAt&&!b.releasedAt?0:!a.releasedAt?1:!b.releasedAt?-1:a.releasedAt.localeCompare(b.releasedAt)):sort==='release'?(b.releasedAt||'').localeCompare(a.releasedAt||''):sort==='name'?a.title.localeCompare(b.title):sort==='price'?(a.priceValue??Infinity)-(b.priceValue??Infinity):b.matches.length-a.matches.length||Number(!!b.fresh)-Number(!!a.fresh));
}

export function groupsForCategory(category,catalog=games){
 const combo={id:'combination',name:'Gameplay combination',tags:['Pure gameplay','+ Building','+ Renovation','+ Dress-up','+ Management','+ Story','+ Combat','+ Exploration','+ Collection & raising']};
 const mechanics={match3:['Match-3','Triple matching','Bubble shooter'],merge:['Merge-2','Merge-3','Number merge'],hypercasual:['Runner','Stacking','Sorting','Physics puzzle','Tap gameplay']};
 const definitions=category==='strategy'?groups.filter(g=>!['combination','casual-mechanics'].includes(g.id)):[{id:'gameplay',name:'Play style',tags:mechanics[category]||[]},combo,...groups.filter(g=>['art','experience','price','platform'].includes(g.id))];
 const available=new Set(catalog.filter(g=>g.categories?.includes(category)).flatMap(g=>g.tags));
 return definitions.map(g=>({...g,tags:g.tags.filter(t=>available.has(t))})).filter(g=>g.tags.length);
}
