const express = require('express');
const app = express();
const getAnimeNews = module.exports = require('./scrapeAnimeNews');

app.get('/animeNews', async(req, res) => {
    const data = await getAnimeNews();
    res.json(data);
});

app.listen(3000, () => console.log('Server running on port 3000'));