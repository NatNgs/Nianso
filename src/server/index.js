const app = require('express')()
const os = require('os')
const path = require('path')
const config = require('./confReader').config
const utils = require('./utils')
const songBrowser = require('./songBrowser')

// Load previous data and song list
const startTime = new Date().getTime()
songBrowser.load(config,
	(count) => console.debug(`Data fully loaded (Duration: ${((new Date().getTime()-startTime)/1000).toFixed(2)}s for ${count} songs)`)
)

app.get('/', (req, res) => {
	const file = path.resolve(__dirname + '/../client/home.html')
	res.sendFile(file)
	console.debug(req.originalUrl, '('+ file + ')')
})

let lastQuerriedIndex = 0
app.get('/get/:index(next|[0-9]+)', (req, res) => {
	const queriedIndex = req.params.index === 'next' ? lastQuerriedIndex+1 : +req.params.index
	const nextSongInfo = songBrowser.getSongInfoByRandomOrderIndex(queriedIndex)
	if(!nextSongInfo) {
		console.debug(req.originalUrl, `(Failed to get index ${queriedIndex})`)
		return res.send({})
	}
	lastQuerriedIndex = queriedIndex
	const ext = utils.getExt(nextSongInfo.origin)
	nextSongInfo.url = '/audio/'+ nextSongInfo.id +'.'+ ext
	nextSongInfo.type = 'audio/' + ext
	nextSongInfo.orderIndex = lastQuerriedIndex
	nextSongInfo.orderIndexOver = songBrowser.getSongCount()
	songBrowser.updateMetadata(nextSongInfo, () => res.send(nextSongInfo))
})

app.post('/update/:songId', (req, res) => {
	console.debug(req.originalUrl, '...')
	let bodyStr = ''
	req.on('data', (chunk) => {
		bodyStr += chunk.toString()
	})
	req.on('end', () => {
		const data = JSON.parse(bodyStr)
		songBrowser.applyMoveAndUpdate(req.params.songId, data)
		res.end()
	})
})

app.get('/data/config.json', (req, res) => {
	res.send(config)
})

app.get('/scripts/:filename', (req, res) => {
	const file = path.resolve(__dirname + '/../client/scripts') + '/' + req.params.filename
	res.sendFile(file)
	console.debug(req.originalUrl, '(' + file + ')')
})

app.get('/styles/:filename', (req, res) => {
	const file = path.resolve(__dirname + '/../client/styles') + '/' + req.params.filename
	res.sendFile(file)
	console.debug(req.originalUrl, '(' + file + ')')
})

app.get('/audio/:filename([0-9a-z]+).:ext', (req, res, nxt) => {
	const file = songBrowser.getSongInfoById(req.params.filename)
	if(file && utils.getExt(file.path) === req.params.ext) {
		res.sendFile(file.path)
		console.debug(req.originalUrl, '(' + file.path + ')')
		return
	}
	nxt()
})

app.get('*', (req, res) => {
	console.debug(req.originalUrl, '(404: Not Found)')
	res.status(404).send('404: ' + req.originalUrl)
})

//
// Launching server

app.listen(config.serverPort, () => {
	// Listing IP and ports available for connexion (LAN)
	console.info('Server listening on:')
	Object.values(os.networkInterfaces()).forEach((ifs) => ifs.forEach((iface) =>
		('IPv4' === iface.family)
		&& console.info('\t' + iface.address + ':' + config.serverPort)
	))
	console.info() // Newline
})
