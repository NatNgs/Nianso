const app = require('express')();
const server = require('http').createServer(app);
const os = require('os');
const config = require('./confReader').config;
const utils = require('./utils')
const SongBrowser = require('./songBrowser');

// Load previous data and song list
SongBrowser.load(config,
	()=>console.debug(`Data fully loaded (Duration: ${((new Date().getTime()-startTime)/1000).toFixed(2)}s for ${SongBrowser.data.toSort.length} songs)`)
)

app.get('/', (req, res) => res.sendFile(__dirname + '/client/home.html'));
app.get('/get/:index', (req, res) => {
	const nextSongInfo = SongBrowser.getSongInfoByRandomOrderIndex(req.params.index);
	if(!nextSongInfo) {
		return res.send({})
	}
	const songData = SongBrowser.updateMetadata(nextSongInfo)
	songData.url = '/audio/'+ nextSongInfo.id +'.'+ utils.getExt(nextSongInfo.origin)
	res.send(songData)
});
app.get('/audio/:filename([0-9a-z]+).:ext', (req, res, nxt) => {
	const path = SongBrowser.getSongInfoById(req.params.filename).path;
	if(utils.getExt(path) === req.params.ext)
		return res.sendFile(path)
	nxt();
});
app.get('*', (req, res) => {
	res.status(404).send('404: ' + req.originalUrl);
});
