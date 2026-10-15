import storeMetrics from './data/store-metrics.json' with {type:'json'};
import hyperGames from './data/hypercasual-games.json' with {type:'json'};
import hyperDetails from './data/hypercasual-details.json' with {type:'json'};
import curatedGames from './data/google-play.json' with {type:'json'};
import recentGames from './data/recent-games.json' with {type:'json'};
import curatedDetails from './data/play-details.json' with {type:'json'};
import recentDetails from './data/recent-details.json' with {type:'json'};
import puzzleGames from './data/puzzle-games.json' with {type:'json'};
import puzzleDetails from './data/puzzle-details.json' with {type:'json'};
export {default as coverage} from './data/scan-coverage.json' with {type:'json'};
const curatedIds=new Set(curatedGames.map(g=>g.id));
const base=[...curatedGames,...recentGames.filter(g=>!curatedIds.has(g.id))];
const puzzles=new Map(puzzleGames.map(g=>[g.id,g]));
const initialGames=[...base.map(g=>({...g,categories:[...new Set(['strategy',...(puzzles.get(g.id)?.categories||[])])]})),...puzzleGames.filter(g=>!base.some(b=>b.id===g.id))];
const merged=new Map();for(const g of [...initialGames,...hyperGames]){const prev=merged.get(g.id);merged.set(g.id,prev?{...prev,categories:[...new Set([...prev.categories,...g.categories])],tags:[...new Set([...prev.tags,...g.tags])],evidence:[...prev.evidence,...g.evidence]}:g);}for(const g of puzzleGames){const target=merged.get(g.id);target.tags=[...new Set([...target.tags,...g.tags])];target.evidence=[...target.evidence,...g.evidence.filter(e=>!target.evidence.some(x=>x.tag===e.tag&&x.excerpt===e.excerpt))];}
export const games=[...merged.values()].map(g=>({...g,minInstalls:g.minInstalls??storeMetrics[g.id]?.minInstalls??null,installEvidence:g.installEvidence??storeMetrics[g.id]??null}));
export const details={...hyperDetails,...puzzleDetails,...recentDetails,...curatedDetails};
