const fs = require('fs')
const path = require('path')
const utils = require('./utils')
const musicMetadata = require('music-metadata')
const nodeID3 = require('node-id3')

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

	const moveFile = function(oldPath, newPath, onSuccess) {
		oldPath = path.resolve(oldPath)
		newPath = path.resolve(newPath)
		if(oldPath === newPath) return

		const ext = '.' + utils.getExt(newPath).toLowerCase()
		const lowerFileName = newPath.toLowerCase().slice(newPath.lastIndexOf(path.sep)+1, -ext.length)

		// Get folder name, create it if needed
		const newFolder = path.dirname(newPath)
		fs.mkdir(newFolder, {recursive: true}, (err) => {
			// Check if newFile already exists
			fs.readdir(newFolder, (err, files) => {
				files = files.map((file) => file.toLowerCase())
				if(files.indexOf(lowerFileName + ext) >= 0) {
					let index = 2
					while (files.indexOf(`${lowerFileName} - ${index}${ext}`) >= 0) {
						index++
					}
					newPath = `${newPath.slice(0, -ext.length)} - ${index}${ext}`
				}

				// Move the file
				fs.rename(oldPath, newPath, (err) => {
					if(err) {
						console.error(`Could not move:\n\tfrom: ${oldPath}\n\tto:   ${newPath}:`, err)
						return
					}
					console.log(`Moved Successfully:\n\tfrom: ${oldPath}\n\tto:   ${newPath}\n`)
					onSuccess(newPath)
				})
			})
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
		if(updateData.path && songInfo && !songInfo.updating) {
			songInfo.updating = true // antispam

			// TODO: Update Metadata here
			const ext = utils.getExt(songInfo.path)
			if(ext === 'mp3') {
				const nodeID3Data = {}

				const id3Mapping = {
					'common/title': 'title',
					'common/subtitle': 'subtitle',

					'common/album': 'album',
					'common/artists': 'artist',
					'common/composer': 'composer',
					'common/conductor': 'conductor',
					'common/publisher': 'publisher',

					'common/language': 'language',
					'common/year': 'year',
					'common/encodedby': 'encodedBy',
					'common/copyright': 'copyright',
					'common/genre': 'genre',
					// 'common/comment': 'comment',
				}
				for(const metadataKey in updateData) {
					if(metadataKey === 'path')
						continue
					if(metadataKey in id3Mapping) {
						if(updateData[metadataKey].join) {
							nodeID3Data[id3Mapping[metadataKey]] = updateData[metadataKey].join(';')
						} else {
							nodeID3Data[id3Mapping[metadataKey]] = updateData[metadataKey]
						}
					} else {
						console.warn('Unsuported updating ' + metadataKey + ' metadata: Not updated.')
					}
				}

				console.log(nodeID3Data)
				const success = nodeID3.write(nodeID3Data, songInfo.path)
				if(!success) console.warn('Failed to update metadata !')
			} else {
				console.warn('Updating metadata not implemented for '+ ext + ' files: Not updated.')
			}

			// Check and replace output name with output path in requested new path
			const newPath = updateData.path.split('/')
			const outputName = newPath.shift()
			const pathBase = _config.outputs.find((out) => out.name === outputName)
			if(pathBase && pathBase.path) {
				// Prepare full new file path
				newPath.unshift(pathBase.path)
				moveFile(songInfo.path, newPath.join('/'), (newFilePath) => {
					songInfo.path = newFilePath
					delete songInfo.updating
				})
			} else {
				console.warn('Not found output path with name: ', outputName)
			}
		}
	}
}

module.exports = new SongBrowser()
