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
export const games = realGames;
export function discover(catalog,{query='',filters={},sort='match',savedOnly=false,saved=[],recentOnly=false}={}){
 const must=Object.keys(filters).filter(t=>filters[t]==='must');
 const avoid=Object.keys(filters).filter(t=>filters[t]==='avoid');
 const prefer=Object.keys(filters).filter(t=>filters[t]==='prefer');
 const words=query.toLowerCase().trim().split(/\s+/).filter(Boolean);
 return catalog.filter(g=>(!recentOnly||g.catalog==='recent')&&(!savedOnly||saved.includes(g.id))&&must.every(t=>g.tags.includes(t))&&avoid.every(t=>!g.tags.includes(t))&&words.every(w=>`${g.title} ${g.developer||''} ${g.subtitle} ${g.world} ${g.tags.join(' ')}`.toLowerCase().includes(w)))
 .map(g=>({...g,matches:prefer.filter(t=>g.tags.includes(t)),missing:prefer.filter(t=>!g.tags.includes(t))}))
 .sort((a,b)=>sort==='release'?(b.releasedAt||'').localeCompare(a.releasedAt||''):sort==='name'?a.title.localeCompare(b.title):sort==='price'?(a.priceValue??Infinity)-(b.priceValue??Infinity):b.matches.length-a.matches.length||Number(!!b.fresh)-Number(!!a.fresh));
}
