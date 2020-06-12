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
	const file = path.resolve(__dirname + '/../client/home.html');
	res.sendFile(file);
	console.debug(req.originalUrl + ' ('+ file + ')');
});

app.get('/get/:index', (req, res) => {
	const nextSongInfo = SongBrowser.getSongInfoByRandomOrderIndex(req.params.index);
	if(!nextSongInfo) {
		console.debug(req.originalUrl + ' (Failed)');
		return res.send({});
	}
	const ext = utils.getExt(nextSongInfo.origin);
	nextSongInfo.url = '/audio/'+ nextSongInfo.id +'.'+ ext;
	nextSongInfo.type = 'audio/' + ext;
	SongBrowser.updateMetadata(nextSongInfo, () => res.send(nextSongInfo));
	console.debug(req.originalUrl + ' (' + nextSongInfo.url +')');
});

app.post('/update/:songId', (req, res) => {
	let bodyStr = '';
	req.on('data',function(chunk){
		bodyStr += chunk.toString();
	});
	req.on('end',function(){
		const data = JSON.parse(bodyStr)
		console.debug('\nEdition data recieved: ', data, '\n');
	});
});

app.get('/data/outputFiles.json', (req, res) => {
	res.send(config.outputs);
});

app.get('/scripts/:filename', (req, res) => {
	const file = path.resolve(__dirname + '/../client/scripts') + '/' + req.params.filename;
	res.sendFile(file);
	console.debug(req.originalUrl + ' (' + file + ')');
});

app.get('/styles/:filename', (req, res) => {
	const file = path.resolve(__dirname + '/../client/styles') + '/' + req.params.filename;
	res.sendFile(file);
	console.debug(req.originalUrl + ' (' + file + ')');
});

app.get('/audio/:filename([0-9a-z]+).:ext', (req, res, nxt) => {
	const file = SongBrowser.getSongInfoById(req.params.filename).path;
	if(utils.getExt(file) === req.params.ext) {
		res.sendFile(file);
		console.debug(req.originalUrl + ' (' + file + ')');
		return;
	}
	nxt();
});

app.get('*', (req, res) => {
	console.debug(req.originalUrl);
	res.status(404).send('404: ' + req.originalUrl);
});

//
// Launching server

app.listen(config.serverPort, () => {
	// Listing IP and ports available for connexion (LAN)
	console.info('Server listening on:');
	Object.values(os.networkInterfaces()).forEach((ifs) => ifs.forEach((iface) =>
		('IPv4' === iface.family)
		&& console.info('\t' + iface.address + ':' + config.serverPort)
	));
	console.info(); // Newline
});
