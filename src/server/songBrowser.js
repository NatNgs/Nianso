const fs = require('fs');
const path = require('path');
const utils = require('./utils')
const musicMetadata = require('music-metadata');

let ids = 0;
const getNewId = () => (((ids++)+Math.random())*1000|0).toString(36);

function SongBrowser() {
	/**
	 * {
	 * 	toSort: [{
	 * 		id: "<an unique id>",
	 * 		origin: "<initial path to audio file>",
	 * 		path: "<current path to audio file>",
	 * 	}]
	 * }
	 */
	let _data = {toSort: []}
	let _config = {}

	const isThisFileASong = (file) => _config.songExts.indexOf(utils.getExt(file)) >= 0;

	const listSongs = async function(folderPath, cbAllLoaded) {
		let todo = 0
		const newTask = ()=>todo++;
		const taskDone = ()=>if(--todo<=0) cbAllLoaded();

		fs.readdir(folderPath, (err, files) => {
			newTask();
			if (!err && files) {
				for(const file of files) {
					newTask();
					file = path.resolve(folderPath, file);
					fs.stat(file, (err, stat) => {
						if (stat) {
							if(stat.isDirectory()) {
								newTask();
								listSongs(file, taskDone)
							} else if(isThisFileASong(file)) {
								_data.toSort.push({id: getNewId(), origin: file, path: file})
							}
						}
						taskDone();
					})
				}
			}
			taskDone();
		});
	}

	//
	// Public

	this.load = async function(config, cbAllLoaded) {
		_config = config;

		let todo = 0;
		const newTask = ()=>todo++;
		const taskDone = ()=>if(--todo<=0) cbAllLoaded();

		newTask();
		for(const inputFolder of config.inputs) {
			newTask();
			listSongs(inputFolder, taskDone)
		}
		taskDone();
	}

	this.getSongInfoById = function(id) {
		return _data.toSort.find(a=>a.id === id)
	}
	const randomOrderIndexes = [];
	this.getSongInfoByRandomOrderIndex = function(index) {
		index = index % _data.toSort.length; // prevent out of bounds

		// Get next randomly
		const unIndexed = _data.toSort.map(a=>a.id).filter(id=>randomOrderIndexes.indexOf(id)<0);
		while(index >= randomOrderIndexes.length) {
			const rndIndex = Math.random()*unIndexed.length;
			randomOrderIndexes.push(unIndexed[rndIndex])
			unIndexed[rndIndex] = unIndexed[unIndexed.length]
			unIndexed.length--
		}

		return this.getSongInfoById(randomOrderIndexes[index])
	}

	this.updateMetadata = function(songInfo, cb) {
		musicMetadata.parseFile(songInfo.path, { duration: true })
		.then((metadata) => {
			songInfo.metadata = metadata
			cb()
		})
		.catch(cb); // Ignore Metadata lookup errors
	}
}

module.exports = SongBrowser;
