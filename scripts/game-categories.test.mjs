import test from 'node:test';import assert from 'node:assert/strict';
import {gameplayCategories,categoryEligibility} from './game-categories.mjs';
test('classifies supported mechanics, permits overlap and rejects unrelated text',()=>{
 assert.deepEqual(gameplayCategories({summary:'Match-3 puzzles and merge identical items'}).map(x=>x.category),['match3','merge']);
 assert.deepEqual(gameplayCategories({summary:'Match opponents in an epic adventure'}),[]);
 assert.equal(categoryEligibility({summary:'Match three pieces',released:'Oct 12, 2024'}),true);
 assert.equal(categoryEligibility({summary:'Match three pieces',released:null}),false);
 assert.equal(categoryEligibility({summary:'Merge identical items',released:'Jan 1, 2020'}),false);
});
