const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

(async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('https://myanimelist.net/news');

    const malNews = await page.evaluate(() => {
        let articleNodes = Array.from(document.querySelectorAll('.news-unit, .news-unit.clearfix.rect'));
        let results = articleNodes.map(node => {
            let titleElement = node.querySelector('.news-unit-right .title');
            let linkElement = titleElement ? titleElement.querySelector('a') : null;
            let contentElement = node.querySelector('.news-unit-right .text');
            return {
                title: titleElement ? titleElement.innerText : null,
                link: linkElement ? linkElement.href : null,
                content: contentElement ? contentElement.innerText : null
            };
        });
        return results;
    });

     // Scraping Anime News Network news
    await page.goto('https://www.animenewsnetwork.com/news');

    const annNews = await page.evaluate(() => {
        let articleNodes = Array.from(document.querySelectorAll('.herald.box.news'));
        let results = articleNodes.map(node => {
            let titleElement = node.querySelector('.wrap > div > h3 > a');
            let contentElement = node.querySelector('.preview > span');
            return {
                title: titleElement ? titleElement.innerText : null,
                link: titleElement ? titleElement.href : null,
                content: contentElement ? contentElement.innerText : null
            };
        });
        return results;
    });

    const response = await fetch('https://www.reddit.com/r/anime/comments/13t3fba/anime_questions_recommendations_and_discussion/.json?sort=top&limit=200', {
        headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    const redditThread = await response.json();
    const redditComments = redditThread[1].data.children.map(comment => ({
        author: comment.data.author,
        comment: comment.data.body,
        link: 'https://www.reddit.com' + comment.data.permalink
    }));

    const workbook = new ExcelJS.Workbook();
    const malWorksheet = workbook.addWorksheet('MyAnimeList News');
    const annWorksheet = workbook.addWorksheet('Anime News Network News');
    const animeRedWorksheet = workbook.addWorksheet('Anime Megathread Top Comments');

    const columns = [
        { header: 'Title', key: 'title', width: 30 },
        { header: 'Link', key: 'link', width: 50 },
        { header: 'Content', key: 'content', width: 200 },
    ];

    const redditColumns = [
        { header: 'Author', key: 'author', width: 30 },
        { header: 'Comment', key: 'comment', width: 200 },
        { header: 'Link', key: 'link', width: 50 },
    ];

    malWorksheet.columns = columns;
    annWorksheet.columns = columns;
    animeRedWorksheet.columns = redditColumns;

    malNews.forEach(news => {
        const row = malWorksheet.addRow(news);
        row.height = 50;
    });

    annNews.forEach(news => {
        const row = annWorksheet.addRow(news);
        row.height = 50;
    });

    redditComments.forEach(comment => {
        const row = animeRedWorksheet.addRow(comment);
        row.height = 200;
    });

    await workbook.xlsx.writeFile('anime_news.xlsx');

    await browser.close();
})();