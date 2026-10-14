import {releaseDate,WINDOW} from './play-import.mjs';
export function gameplayCategories(app){
 const text=[app.title,app.summary,app.description].filter(Boolean).join('\n');
 const evidence=[];
 if(app.genreId==='GAME_STRATEGY')evidence.push({category:'strategy',excerpt:'GAME_STRATEGY',basis:'Official Google Play category'});
 for(const [category,re] of [['match3',/\bmatch[ -]?3\b|\bmatch[ -]?three\b|三消|消除三个|マッチ3/i],['merge',/\bmerge (?:two|three|\d|items|objects|dragons|puzzles|puzzle|game|games)|\bmerg(?:e|ing)\b[^.!\n]{0,70}\b(?:combine|identical|matching|items|objects|pieces)\b|合成相同|合并相同/i]]){
  const match=text.match(re);if(match)evidence.push({category,excerpt:match[0],basis:'Official developer gameplay text'});
 }
 return evidence;
}
export function categoryEligibility(app){
 if(app.preregister)return false;
 const date=releaseDate(app.released);
 return !!date&&date>=WINDOW.from&&date<=WINDOW.to&&gameplayCategories(app).some(e=>e.category!=='strategy');
}
