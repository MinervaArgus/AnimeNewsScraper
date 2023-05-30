const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');
const xml2js = require('xml2js');

// Scraping MAL News
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

    // Scraping anime Megathread hot comments
    const animeMegathreadResponse = await fetch('https://www.reddit.com/r/anime/comments/13t3fba/anime_questions_recommendations_and_discussion/.json?sort=hot&limit=200', {
        headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    const redditThread = await animeMegathreadResponse.json();
    const redditComments = redditThread[1].data.children.map(comment => ({
        author: comment.data.author,
        comment: comment.data.body,
        link: 'https://www.reddit.com' + comment.data.permalink
    }));

    // Scraping animenews subreddit hot posts
    const animenewsSubredditResponse = await fetch('https://www.reddit.com/r/animenews/new/.json?limit=50', {
        headers: { 'User-Agent': 'Mozilla/5.0' } 
    });
    const animenewsSubredditData = await animenewsSubredditResponse.json();
    const animenewsSubredditPosts = animenewsSubredditData.data.children.map(post => ({
        title: post.data.title,
        author: post.data.author,
        link: 'https://www.reddit.com' + post.data.permalink,
        upvotes: post.data.ups,
        comments: post.data.num_comments
    }));

    // Scraping crunchyroll rss feed
    const rssResponse = await fetch('http://feeds.feedburner.com/crunchyroll/animenews');
    const rssData = await rssResponse.text();
    const rssJson = await xml2js.parseStringPromise(rssData);

    const rssPosts = rssJson.rss.channel[0].item.map(post => ({
        title: post.title[0],
        link: post.link[0],
        description: post.description[0]
    }));

    const workbook = new ExcelJS.Workbook();
    const malWorksheet = workbook.addWorksheet('MyAnimeList News');
    const annWorksheet = workbook.addWorksheet('Anime News Network News');
    const animeRedWorksheet = workbook.addWorksheet('Anime Megathread Top Comments');
    const animeNewsSubWorksheet = workbook.addWorksheet('AnimeNews Subreddit');
    const crunchyrollWorksheet = workbook.addWorksheet('Crunchyroll News');

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

    const animeNewsSubColumns = [
        { header: 'Title', key: 'title', width: 100 },
        { header: 'Author', key: 'author', width: 20 },
        { header: 'Link', key: 'link', width: 50 },
        { header: 'Upvotes', key: 'upvotes', width: 10 },
        { header: 'Comments', key: 'comments', width: 10 },
    ];

    const rssColumns = [
        { header: 'Title', key: 'title', width: 100 },
        { header: 'Link', key: 'link', width: 50 },
        { header: 'Description', key: 'description', width: 200 },
    ];

    malWorksheet.columns = columns;
    annWorksheet.columns = columns;
    animeRedWorksheet.columns = redditColumns;
    animeNewsSubWorksheet.columns = animeNewsSubColumns;
    crunchyrollWorksheet.columns = rssColumns;

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

    animenewsSubredditPosts.forEach(post => {
        const row = animeNewsSubWorksheet.addRow(post);
        row.height = 200;
    })

    rssPosts.forEach(post => {
        const row = crunchyrollWorksheet.addRow(post);
        row.height = 100;
    })

    await workbook.xlsx.writeFile('anime_news.xlsx');

    await browser.close();
})();