import test from 'node:test';import assert from 'node:assert/strict';
import * as rules from './game-categories.mjs';
import * as discovery from '../src/discovery.js';
test('combo evidence supports overlap but never assumes pure or negated mechanics',()=>{
 assert.equal(typeof rules.gameplayTags,'function');
 assert.deepEqual(rules.gameplayTags({description:'Match-3 puzzles. Build your city. Renovate rooms and dress up characters.'}).filter(e=>e.tag.startsWith('+')).map(e=>e.tag),['+ Building','+ Renovation','+ Dress-up']);
 assert.deepEqual(rules.gameplayTags({description:'Match-3 puzzles without building or renovation.'}).filter(e=>e.tag.startsWith('+')||e.tag==='Pure gameplay'),[]);
 assert.deepEqual(rules.gameplayTags({description:'Match-3 puzzles with hundreds of levels.'}).filter(e=>e.tag.startsWith('+')||e.tag==='Pure gameplay'),[]);
 assert.ok(rules.gameplayTags({description:'Pure match-3 gameplay.'}).some(e=>e.tag==='Pure gameplay'));
});
test('hypercasual requires explicit evidence and does not enter puzzle eligibility',()=>{
 assert.ok(rules.gameplayCategories({description:'A hyper-casual runner'}).some(e=>e.category==='hypercasual'));
 assert.ok(!rules.gameplayCategories({genreId:'GAME_CASUAL',description:'A casual adventure'}).some(e=>e.category==='hypercasual'));
 assert.equal(rules.categoryEligibility({description:'Hypercasual runner',released:'Jan 1, 2025'}),false);
});
test('category filters omit strategy mechanics and unsupported individual tags',()=>{
 assert.equal(typeof discovery.groupsForCategory,'function');
 const catalog=[{categories:['match3'],tags:['+ Building','Free download','Tower defense']}];
 const tags=discovery.groupsForCategory('match3',catalog).flatMap(g=>g.tags);
 assert.ok(tags.includes('+ Building'));assert.ok(tags.includes('Free download'));assert.ok(!tags.includes('Tower defense'));assert.ok(!tags.includes('+ Renovation'));
});
