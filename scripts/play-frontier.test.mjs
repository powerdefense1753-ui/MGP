import test from 'node:test';
import assert from 'node:assert/strict';
import {listingLinks, queueTask, pickTasks, developerKey} from './play-frontier.mjs';
test('extract only Google Play app links and deduplicate language variants',()=>{
 const html='<a href="/store/apps/details?id=com.real.game&amp;hl=en">x</a><a href="https://play.google.com/store/apps/details?id=com.real.game&hl=zh">x</a><a href="https://evil.test/store/apps/details?id=bad">x</a><a href="/store/apps/details?id=com.next.game">y</a>';
 assert.deepEqual(listingLinks(html),['com.real.game','com.next.game']);
});
test('completed tasks cannot be queued twice and retry delays are respected',()=>{
 const tasks={};queueTask(tasks,'app','a');queueTask(tasks,'app','a');assert.equal(Object.keys(tasks).length,1);
 tasks['app:a'].status='done';queueTask(tasks,'app','a');assert.equal(pickTasks(tasks,3,1000).length,0);
 queueTask(tasks,'app','b');tasks['app:b'].notBefore=2000;assert.equal(pickTasks(tasks,3,1000).length,0);assert.equal(pickTasks(tasks,3,2000).length,1);
});

test('developer discovery uses the numeric listing identity or decodes encoded names',()=>{
 assert.equal(developerKey({developerId:'Century+Games',developerInternalID:'12345'}),'12345');
 assert.equal(developerKey({developerId:'Studio+Name%2C+Ltd.'}),'Studio Name, Ltd.');
});
