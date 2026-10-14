import {games,details} from '../src/catalog.js';
import {test,expect} from '@playwright/test';
test.use({locale:'zh-CN'});
test('cards expose game information, real scores, review evidence and official screenshots',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.getByRole('complementary', {name:'筛选游戏'})).toBeVisible();await expect(page.locator('.game-card')).toHaveCount(Math.min(24,games.length));
 await expect(page.locator('.score').first()).toContainText('4.6');expect(await page.locator('.screenshot img').count()).toBeGreaterThanOrEqual(22);
 await expect.poll(()=>page.locator('.screenshot img').first().evaluate(im=>im.complete&&im.naturalWidth>0)).toBe(true);
 await page.screenshot({path:'.playwright/desktop.png',fullPage:true});
 await page.locator('.game-name').first().click();await page.locator('.sample-link').click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.review-excerpt')).toHaveCount(3);await expect(page.locator('.review-warning')).toContainText('不是全体用户共识');
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'ROME: Total War · 截图 1',exact:true}).click();await expect(page.locator('.full-screenshot')).toBeVisible();
 const first=await page.locator('.full-screenshot').getAttribute('src');await page.getByRole('button',{name:'下一张截图'}).click();expect(await page.locator('.full-screenshot').getAttribute('src')).not.toBe(first);await expect(page.locator('.gallery-footer')).toContainText('2 / '+details['com.feralinteractive.rometw'].screenshots.length);
 await page.getByRole('button',{name:'下一张截图'}).click();await expect(page.locator('.gallery-footer')).toContainText('3 / ');await expect.poll(()=>page.locator('.full-screenshot').evaluate(im=>im.naturalWidth>0),{timeout:30000}).toBe(true);await page.keyboard.press('Escape');await page.getByTestId('language-select').selectOption('en');await expect(page.getByRole('complementary', {name:'Filter games'})).toBeVisible();expect(errors).toEqual([]);
});
test('filters, no-result recovery, saved collection and store link update the visible cards immediately',async({page})=>{
 await page.goto('/');await page.locator('[data-tag="Roman"]').click();await expect(page.getByRole('button',{name:'ROME: Total War',exact:true})).toBeVisible();
 await page.locator('[data-tag="Chinese"]').click();await expect(page.locator('.game-card')).toHaveCount(0);await expect(page.getByText('没有符合条件的游戏')).toBeVisible();await page.getByRole('button',{name:'重置并查看全部'}).click();
 await page.getByRole('button',{name:'最好有',exact:true}).click();await page.locator('[data-tag="Chinese"]').click();await expect(page.locator('.game-card')).toHaveCount(Math.min(24,games.length));await expect(page.locator('.game-name').first()).toContainText('The Last Warlord');
 await page.getByRole('button',{name:'清除筛选',exact:true}).click();await page.getByLabel('搜索游戏').fill('Last Warlord');await expect(page.locator('.game-card')).toHaveCount(1);await page.getByRole('button',{name:'收藏 The Last Warlord',exact:true}).click();await page.reload();await page.getByRole('button',{name:/我的收藏/}).click();await expect(page.locator('.game-card')).toHaveCount(1);
 await page.getByRole('button',{name:'The Last Warlord',exact:true}).click();await expect(page.getByRole('link',{name:'前往 Google Play'})).toHaveAttribute('href',/id=com.longyoug.hmby/);await expect(page.locator('.detail-facts')).toContainText('未确认');await page.keyboard.press('Escape');await page.getByRole('button',{name:'取消收藏 The Last Warlord',exact:true}).click();await expect(page.locator('.game-card')).toHaveCount(0);
});
test('mobile cards fit without horizontal scrolling and screenshot dialog fits viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'.playwright/mobile.png',fullPage:true});

 await page.getByRole('button',{name:'ROME: Total War · 截图 1',exact:true}).click();await expect(page.locator('.full-screenshot')).toBeVisible();
 const box=await page.getByRole('dialog').boundingBox();expect(box.width).toBeLessThanOrEqual(390);await page.getByRole('button',{name:'关闭弹窗'}).click();
});

test('recent release filter, sorting and pagination work without page reload',async({page})=>{
 await page.goto('/');await page.getByRole('checkbox',{name:'仅看近两年首发'}).check();
 const expected=games.filter(g=>g.catalog==='recent');
 await expect(page.locator('.result-count')).toHaveText(String(expected.length));
 await expect(page.locator('.game-card')).toHaveCount(Math.min(24,expected.length));
 await expect(page.getByRole('button',{name:'ROME: Total War',exact:true})).toHaveCount(0);
 await page.getByLabel('排序方式').selectOption('release');
 if(expected.length){await expect(page.locator('.release-badge').first()).toContainText([...expected].sort((a,b)=>b.releasedAt.localeCompare(a.releasedAt))[0].releasedAt);await page.locator('.game-name').first().click();await expect(page.locator('.review-pending')).toContainText('暂无评论摘要');await page.getByRole('button',{name:'关闭弹窗'}).click();}
 if(expected.length>24){await page.getByLabel('选择页码').first().selectOption('2');await expect(page.locator('.game-card')).toHaveCount(Math.min(24,expected.length-24));await expect(page.locator('.row-number').first()).toHaveText('25');}
});

test('page selection, last page boundaries and filtering reset',async({page})=>{
 await page.goto('/');const total=Math.ceil(games.length/24);
 await expect(page.getByRole('button',{name:'上一页',exact:true}).first()).toBeDisabled();
 await page.getByLabel('选择页码').first().selectOption(String(total));
 await expect(page.locator('.game-card')).toHaveCount(games.length-(total-1)*24);
 await expect(page.getByRole('button',{name:'下一页',exact:true}).first()).toBeDisabled();
 await page.getByRole('button',{name:'上一页',exact:true}).first().click();
 await expect(page.getByLabel('选择页码').first()).toHaveValue(String(total-1));
 await page.getByLabel('搜索游戏').fill('ROME');
 await expect(page.getByLabel('选择页码').first()).toHaveValue('1');
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
