"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const puppeteer_1 = require("puppeteer");
const fs_1 = require("fs");
var Region;
(function (Region) {
    Region["Moscow"] = "\u041C\u043E\u0441\u043A\u0432\u0430 \u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u044C";
    Region["SPb"] = "\u0421\u0430\u043D\u043A\u0442-\u041F\u0435\u0442\u0435\u0440\u0431\u0443\u0440\u0433 \u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u044C";
    Region["Vladimir"] = "\u0412\u043B\u0430\u0434\u0438\u043C\u0438\u0440\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    Region["Kaluga"] = "\u041A\u0430\u043B\u0443\u0436\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    Region["Ryazan"] = "\u0420\u044F\u0437\u0430\u043D\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    Region["Tver"] = "\u0422\u0432\u0435\u0440\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
    Region["Tula"] = "\u0422\u0443\u043B\u044C\u0441\u043A\u0430\u044F \u043E\u0431\u043B.";
})(Region || (Region = {}));
function formatDate(date) {
    return date.toISOString().replace(/[:.]/g, '-');
}
function getProductNameFromUrl(url) {
    const urlParts = url.split('/');
    const lastPart = urlParts[urlParts.length - 1];
    const nameMatch = lastPart.match(/[\w-]+(?=--\d+)/);
    return nameMatch != null ? nameMatch[0] : 'product';
}
async function delay(time) {
    return new Promise(function (resolve) {
        setTimeout(resolve, time);
    });
}
async function scrapeProduct(url, regionKey) {
    const browser = await puppeteer_1.default.launch({
        headless: false,
        args: ['--start-maximized'],
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url);
    const regionToSelect = Region[regionKey];
    const isRegionSelected = await page.evaluate(regionToSelect => {
        var _a, _b;
        const regionTextElement = document.querySelector('div[class^="Region_region"] span:not([class^="Region_regionIcon"])');
        return (_b = (_a = regionTextElement === null || regionTextElement === void 0 ? void 0 : regionTextElement.textContent) === null || _a === void 0 ? void 0 : _a.trim().includes(regionToSelect)) !== null && _b !== void 0 ? _b : false;
    }, regionToSelect);
    if (!isRegionSelected) {
        await page.click('[class^="Region_region__"]');
        await page.waitForFunction(() => document.querySelector('[class^="UiRegionListBase_listWrapper__"]'));
        await page.evaluate(region => {
            const items = Array.from(document.querySelectorAll('[class^="UiRegionListBase_item__"]'));
            const targetItem = items.find(item => { var _a; return ((_a = item.textContent) === null || _a === void 0 ? void 0 : _a.trim()) === region; });
            if (targetItem) {
                targetItem.click();
            }
        }, regionToSelect);
        await delay(7000);
    }
    await page.waitForSelector('[class^="ProductPage_informationBlock__"]', { timeout: 10000 });
    const productName = getProductNameFromUrl(url);
    const regionName = regionKey;
    const dateStr = formatDate(new Date());
    const region = Region[regionKey].replace(/\s+/g, '-');
    const screenshotFileName = `${productName}-${region}-${dateStr}.jpg`;
    const screenshotPath = `../results/${regionName}/screens/${screenshotFileName}`;
    await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight);
    });
    await delay(1000);
    await page.evaluate(() => {
        window.scrollTo(0, 0);
    });
    await delay(3000);
    try {
        const cookieSelector = 'div[class^="CookiesAlert_agreeButton__"] button';
        if ((await page.$(cookieSelector)) !== null) {
            await page.click(cookieSelector);
        }
        const tooltipSelector = 'button[class^="Tooltip_closeIcon"]';
        if ((await page.$(tooltipSelector)) !== null) {
            await page.click(tooltipSelector);
        }
    }
    catch (e) {
        console.log('Ошибка при попытке закрыть всплывающие окна:', e);
    }
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const productInfo = await page.evaluate(() => {
        var _a, _b, _c, _d, _e, _f, _g;
        const priceElement = document.querySelector('[class^="ProductPage_informationBlock__"] [class^="PriceInfo_root__"] [class^="Price_price__"]:not([class*="Price_role_old__"])');
        const priceText = (_b = (_a = priceElement === null || priceElement === void 0 ? void 0 : priceElement.textContent) === null || _a === void 0 ? void 0 : _a.trim().replace(',', '.').replace(/[^0-9.]/g, '')) !== null && _b !== void 0 ? _b : null;
        const oldPriceElement = document.querySelector('[class^="ProductPage_informationBlock__"] [class^="PriceInfo_oldPrice__"] [class^="Price_price__"]');
        const oldPriceText = (_d = (_c = oldPriceElement === null || oldPriceElement === void 0 ? void 0 : oldPriceElement.textContent) === null || _c === void 0 ? void 0 : _c.trim().replace(',', '.').replace(/[^0-9.]/g, '')) !== null && _d !== void 0 ? _d : null;
        const ratingElement = document.querySelector('[class^="ProductPage_title__"] [class^="Rating_root__"] [class^="Rating_value__"]');
        const ratingText = ratingElement ? (_e = ratingElement === null || ratingElement === void 0 ? void 0 : ratingElement.textContent) === null || _e === void 0 ? void 0 : _e.trim() : 0;
        const reviewCountElement = document.querySelector('[class^="ProductPage_title__"] [class^="ActionsRow_reviews__"]');
        const reviewCountText = (_g = (_f = reviewCountElement === null || reviewCountElement === void 0 ? void 0 : reviewCountElement.textContent) === null || _f === void 0 ? void 0 : _f.trim()) !== null && _g !== void 0 ? _g : '';
        const price = priceText ? parseFloat(priceText) : null;
        const oldPrice = oldPriceText ? parseFloat(oldPriceText) : null;
        const rating = ratingText ? parseFloat(ratingText) : null;
        const reviewCount = parseInt(reviewCountText.replace(/\D/g, ''), 10) || 0;
        return { price, oldPrice, rating, reviewCount };
    });
    const productFileName = `${productName}-${region}-${dateStr}.txt`;
    const productFilePath = `../results/${regionName}/text-info/${productFileName}`;
    (0, fs_1.writeFileSync)(productFilePath, JSON.stringify(productInfo), 'utf-8');
    await browser.close();
}
const args = process.argv.slice(2);
const [url, regionArg] = args;
const regionKey = Object.keys(Region).find(key => Region[key] === regionArg);
if (regionKey == null) {
    throw new Error(`Invalid region: ${regionArg}`);
}
scrapeProduct(url, regionKey).catch(console.error);
//# sourceMappingURL=index.js.map