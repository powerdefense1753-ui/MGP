import {releaseDate,WINDOW} from './play-import.mjs';
export function gameplayCategories(app){
 const text=[app.title,app.summary,app.description].filter(Boolean).join('\n');
 const evidence=[];
 if(app.genreId==='GAME_STRATEGY')evidence.push({category:'strategy',excerpt:'GAME_STRATEGY',basis:'Official Google Play category'});
 for(const [category,re] of [['match3',/\bmatch[ -]?3\b|\bmatch[ -]?three\b|三消|消除三个|マッチ3/i],['merge',/\bmerge (?:two|three|\d|items|objects|dragons|puzzles|puzzle|game|games)|\bmerg(?:e|ing)\b[^.!\n]{0,70}\b(?:combine|identical|matching|items|objects|pieces)\b|合成相同|合并相同/i]]){
  const match=text.match(re);if(match)evidence.push({category,excerpt:match[0],basis:'Official developer gameplay text'});
 }
 const hyper=text.match(/\bhyper[ -]?casual\b/i);if(hyper)evidence.push({category:'hypercasual',excerpt:hyper[0],basis:'Official developer gameplay text'});
 return evidence;
}
export function categoryEligibility(app){
 if(app.preregister)return false;
 const date=releaseDate(app.released);
 return !!date&&date>=WINDOW.from&&date<=WINDOW.to&&gameplayCategories(app).some(e=>['match3','merge'].includes(e.category));
}

export function gameplayTags(app){
 const text=[app.title,app.summary,app.description].filter(Boolean).join('\n');
 const patterns=[['Match-3',/\bmatch[ -]?(?:3|three)\b/i],['Triple matching',/\b(?:triple match|match three identical|match 3 identical)\b/i],['Bubble shooter',/\bbubble shoot(?:er|ing)\b/i],['Merge-2',/\bmerge[ -]?(?:2|two)\b/i],['Merge-3',/\bmerge[ -]?(?:3|three)\b/i],['Number merge',/\bmerge[^.!\n]{0,25}\bnumbers?\b/i],['Pure gameplay',/\bpure (?:match[ -]?3|match[ -]?three|merge|hyper[ -]?casual)(?: gameplay| puzzles?)?\b/i],['+ Building',/\b(?:build|construct)(?:ing)?\b[^.!\n]{0,55}\b(?:city|town|house|home|kingdom|buildings?)\b/i],['+ Renovation',/\b(?:renovate|renovation|decorate|decoration|remodel)(?:s|ing)?\b/i],['+ Dress-up',/\bdress[ -]?up\b|\bmakeover\b/i],['+ Management',/\b(?:manage|run)\b[^.!\n]{0,45}\b(?:restaurant|shop|cafe|hotel|farm|business)\b/i],['+ Story',/\b(?:follow|uncover|discover|experience)\b[^.!\n]{0,40}\b(?:story|stories|mystery)\b/i],['+ Combat',/\b(?:fight|battle|defeat)\b[^.!\n]{0,40}\b(?:enemies|monsters|bosses|opponents)\b/i],['+ Exploration',/\bexplore\b[^.!\n]{0,40}\b(?:world|island|lands|dungeons)\b/i],['+ Collection & raising',/\b(?:collect|raise)\b[^.!\n]{0,40}\b(?:pets|creatures|dragons|animals)\b/i],['Runner',/\b(?:runner|running|run and jump)\b/i],['Stacking',/\bstack(?:ing)?\b/i],['Sorting',/\bsort(?:ing)?\b/i],['Physics puzzle',/\bphysics[ -]based\b/i],['Tap gameplay',/\b(?:tap to|one[ -]tap)\b/i]];
 return patterns.flatMap(([tag,re])=>{const matches=[...text.matchAll(new RegExp(re.source,'gi'))];const m=matches.find(m=>!/\b(?:without|no|not|never)\b[^.!\n]{0,70}$/i.test(text.slice(0,m.index)));return m?[{tag,excerpt:m[0],basis:'Official developer gameplay text'}]:[]});
}
export function hypercasualEligibility(app){const date=releaseDate(app.released);return !app.preregister&&!!date&&date>=WINDOW.from&&date<=WINDOW.to&&gameplayCategories(app).some(e=>e.category==='hypercasual');}

