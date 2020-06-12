const app = require('express')();
const config = require('./confReader').config;
const os = require('os');
const utils = require('./utils');
const SongBrowser = require('./songBrowser');

// Load previous data and song list
const startTime = new Date().getTime();
SongBrowser.load(config,
	(count) => console.debug(`Data fully loaded (Duration: ${((new Date().getTime()-startTime)/1000).toFixed(2)}s for ${count} songs)`)
);

app.get('/', (req, res) => res.sendFile(__dirname + '/client/home.html'));
app.get('/get/:index', (req, res) => {
	const nextSongInfo = SongBrowser.getSongInfoByRandomOrderIndex(req.params.index);
	if(!nextSongInfo) {
		return res.send({});
	}
	nextSongInfo.url = '/audio/'+ nextSongInfo.id +'.'+ utils.getExt(nextSongInfo.origin);
	SongBrowser.updateMetadata(nextSongInfo, () => res.send(nextSongInfo));
});
app.get('/audio/:filename([0-9a-z]+).:ext', (req, res, nxt) => {
	const path = SongBrowser.getSongInfoById(req.params.filename).path;
	if(utils.getExt(path) === req.params.ext)
		return res.sendFile(path);
	nxt();
});
app.get('*', (req, res) => {
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
