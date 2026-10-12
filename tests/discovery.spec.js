import {test,expect} from '@playwright/test';
test('table exposes five requested fields, real scores, review evidence and official screenshots',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');
 await expect(page.locator('thead th')).toHaveCount(5);await expect(page.locator('.game-row')).toHaveCount(11);
 await expect(page.locator('.score').first()).toContainText('4.6');await expect(page.locator('.screenshot img')).toHaveCount(22);
 expect(await page.locator('.screenshot img').evaluateAll(images=>images.every(im=>im.complete&&im.naturalWidth>0))).toBe(true);
 await page.screenshot({path:'.playwright/desktop.png',fullPage:true});
 await page.locator('.sample-link').first().click();await expect(page.getByRole('dialog')).toBeVisible();await expect(page.locator('.review-excerpt')).toHaveCount(3);await expect(page.locator('.review-warning')).toContainText('不是全体用户共识');
 await page.keyboard.press('Escape');await expect(page.getByRole('dialog')).toHaveCount(0);
 await page.getByRole('button',{name:'View ROME: Total War screenshot 1',exact:true}).click();await expect(page.locator('.full-screenshot')).toBeVisible();
 const first=await page.locator('.full-screenshot').getAttribute('src');await page.getByRole('button',{name:'Next screenshot'}).click();expect(await page.locator('.full-screenshot').getAttribute('src')).not.toBe(first);await expect(page.locator('.gallery-footer')).toContainText('2 / 2');
 await page.keyboard.press('Escape');await page.getByRole('button',{name:'EN',exact:true}).click();await expect(page.locator('thead')).toContainText('Player experience');expect(errors).toEqual([]);
});
test('filters, no-result recovery, saved collection and store link still work in table view',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'筛选',exact:true}).click();await page.getByRole('button',{name:'Roman',exact:true}).click();await expect(page.locator('.game-row')).toHaveCount(1);
 await page.getByRole('button',{name:'Chinese',exact:true}).click();await expect(page.locator('.game-row')).toHaveCount(0);await expect(page.getByText('没有符合条件的游戏')).toBeVisible();await page.getByRole('button',{name:'重置并查看全部'}).click();
 await page.getByRole('button',{name:'最好有',exact:true}).click();await page.getByRole('button',{name:'Chinese',exact:true}).click();await expect(page.locator('.game-row')).toHaveCount(11);await expect(page.locator('.game-name').first()).toContainText('The Last Warlord');
 await page.getByRole('button',{name:'清除筛选',exact:true}).click();await page.getByLabel('Search games').fill('Last Warlord');await expect(page.locator('.game-row')).toHaveCount(1);await page.getByRole('button',{name:'Save The Last Warlord',exact:true}).click();await page.reload();await page.getByRole('button',{name:/我的收藏/}).click();await expect(page.locator('.game-row')).toHaveCount(1);
 await page.getByRole('button',{name:'The Last Warlord',exact:true}).click();await expect(page.getByRole('link',{name:'前往 Google Play'})).toHaveAttribute('href',/id=com.longyoug.hmby/);await expect(page.locator('.detail-facts')).toContainText('未确认');await page.keyboard.press('Escape');await page.getByRole('button',{name:'Unsave The Last Warlord',exact:true}).click();await expect(page.locator('.game-row')).toHaveCount(0);
});
test('mobile table scrolls within its container and screenshot dialog fits viewport',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'.playwright/mobile.png',fullPage:true});
 await page.locator('.table-scroll').evaluate(el=>el.scrollLeft=el.scrollWidth);
 await page.getByRole('button',{name:'View ROME: Total War screenshot 1',exact:true}).click();await expect(page.locator('.full-screenshot')).toBeVisible();
 const box=await page.getByRole('dialog').boundingBox();expect(box.width).toBeLessThanOrEqual(390);await page.getByRole('button',{name:'Close dialog'}).click();
});
