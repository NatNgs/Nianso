const app = require('express')();
const os = require('os');
const path = require('path');
const config = require('./confReader').config;
const utils = require('./utils');
const SongBrowser = require('./songBrowser');

// Load previous data and song list
const startTime = new Date().getTime();
SongBrowser.load(config,
	(count) => console.debug(`Data fully loaded (Duration: ${((new Date().getTime()-startTime)/1000).toFixed(2)}s for ${count} songs)`)
);

app.get('/', (req, res) => {
	console.debug(req.originalUrl);
	res.sendFile(path.resolve(__dirname + '/../client/home.html'));
});
app.get('/get/:index', (req, res) => {
	console.debug(req.originalUrl);
	const nextSongInfo = SongBrowser.getSongInfoByRandomOrderIndex(req.params.index);
	if(!nextSongInfo) {
		return res.send({});
	}
	const ext = utils.getExt(nextSongInfo.origin);
	nextSongInfo.url = '/audio/'+ nextSongInfo.id +'.'+ ext;
	nextSongInfo.type = 'audio/' + ext;
	SongBrowser.updateMetadata(nextSongInfo, () => res.send(nextSongInfo));
});
app.get('/scripts/:filename', (req, res) => {
	res.sendFile(path.resolve(__dirname + '/../client/scripts') + '/' + req.params.filename);
});
app.get('/styles/:filename', (req, res) => {
	res.sendFile(path.resolve(__dirname + '/../client/styles') + '/' + req.params.filename);
});
app.get('/audio/:filename([0-9a-z]+).:ext', (req, res, nxt) => {
	console.debug(req.originalUrl);
	const path = SongBrowser.getSongInfoById(req.params.filename).path;
	if(utils.getExt(path) === req.params.ext)
		return res.sendFile(path);
	nxt();
});
app.get('*', (req, res) => {
	console.debug(req.originalUrl);
	res.status(404).send('404: ' + req.originalUrl);
});

app.listen(config.serverPort, () => {
	// Listing IP and ports available for connexion (LAN)
	console.info('Server listening on:');
	Object.values(os.networkInterfaces()).forEach((ifs) => ifs.forEach((iface) =>
		('IPv4' === iface.family)
		&& console.info('\t' + iface.address + ':' + config.serverPort)
	));
	console.info(); // Newline
});
