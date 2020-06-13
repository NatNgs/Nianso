const fs = require('fs')
const path = require('path')
const utils = require('./utils')
const musicMetadata = require('music-metadata')

let ids = 0
const getNewId = () => 's'+ (((ids++)+Math.random())*10000|0).toString(36)

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
	const _data = {toSort: []}
	let _config = {}

	const isThisFileASong = (file) => _config.songExts.indexOf(utils.getExt(file)) >= 0

	const alreadyListedFolders = {}
	const listSongs = function(folderPath, cbAllLoaded) {
		if(alreadyListedFolders[folderPath]) return cbAllLoaded()
		alreadyListedFolders[folderPath] = true

		let todo = 0
		const newTask = () => todo++
		const taskDone = () => (--todo<=0) && cbAllLoaded()

		fs.readdir(folderPath, (err, files) => {
			newTask()
			if (!err && files) {
				for(const file of files) {
					newTask()
					const filePath = path.resolve(folderPath, file)
					fs.stat(filePath, (err, stat) => {
						if (stat) {
							if(stat.isDirectory()) {
								newTask()
								listSongs(filePath, taskDone)
							} else if(isThisFileASong(file)) {
								_data.toSort.push({id: getNewId(), origin: filePath, path: filePath})
							}
						}
						taskDone()
					})
				}
			}
			taskDone()
		})
	}

	//
	// Public

	this.load = function(config, cbAllLoaded) {
		_config = config

		let todo = 0
		const newTask = () => todo++
		const taskDone = () => (--todo<=0) && cbAllLoaded(_data.toSort.length)

		newTask()
		for(const inputFolder of config.inputs) {
			newTask()
			listSongs(inputFolder, taskDone)
		}
		taskDone()
	}

	this.getSongInfoById = function(id) {
		return _data.toSort.find((a) => a.id === id)
	}
	const randomOrderIndexes = []
	this.getSongInfoByRandomOrderIndex = function(index) {
		index = index % _data.toSort.length // prevent out of bounds

		// Get next randomly
		const unIndexed = _data.toSort.map((a) => a.id).filter((id) => randomOrderIndexes.indexOf(id)<0)
		while(index >= randomOrderIndexes.length) {
			const rndIndex = Math.random()*unIndexed.length | 0
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
			.catch(cb) // Ignore Metadata lookup errors
	}

	this.getSongCount = function() {
		return _data.toSort.length
	}

	this.applyMoveAndUpdate = function(songId, updateData) {
		const songInfo = this.getSongInfoById(songId)
		if(updateData.path && songInfo) {
			// Check and replace output name with output path in requested new path
			const newPath = updateData.path.split('/')
			const outputName = newPath.shift()
			const pathBase = _config.outputs.find((out) => out.name === outputName)
			if(pathBase && pathBase.path) {
				// Prepare full new file path
				newPath.unshift(pathBase.path)
				const newFilePath = path.resolve(...newPath)
				// Check if is changed
				if(newFilePath !== songInfo.path) {
					// Get folder name, create it if needed
					const fileName = newPath.pop()
					const folder = path.resolve(...newPath)
					newPath.push(fileName)
					fs.mkdir(folder, {recursive: true}, (err) => {
						// Move the file
						fs.rename(songInfo.path, newFilePath, (err) => {
							if(err) {
								console.error(`Could not move ${songInfo.path} to ${newFilePath} (from ${songInfo.origin}):`, err)
								return
							}
							console.log(`Moved ${songInfo.path}\n\tto ${newFilePath}`)
							songInfo.path = newFilePath
						})
					})
				}
			} else {
				console.warn('Not found output path with name: ', outputName)
			}
		} else {
			console.info('Not found song info or path is null', songId, updateData.path)
		}
	}
}

module.exports = new SongBrowser()
