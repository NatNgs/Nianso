const fileNameRestrictedChars = /[/.<>:"\\|?*]+/g
const folderNameRestrictedChars = /[.<>:"\\|?*]+/g
const slashes = /[\\/]+/g
function FolderSelect() { // eslint-disable-line no-unused-vars
	let _div
	let _conf
	const _outputSelector = $('<select></select>').attr('id', 'outputSelector')
	const _subfolderSelector = $('<input type="text"/>').attr('id', 'subfolderSelector')
	const _fileNameSelector = $('<input type="text"/>').attr('id', 'fileNameSelector')
	const _fileNameExt = $('<span></span>')

	//
	// Public

	this.setContainer = function(container) {
		_div = container.empty()

		const divSubFolderSelector = $('<div></div>').attr('id', 'subfolderSelector_div')
		divSubFolderSelector.append('<span>/</span>')
		divSubFolderSelector.append(_subfolderSelector)
		divSubFolderSelector.append('<span>/</span>')

		const divFileNameSelector = $('<div></div>').attr('id', 'fileNameSelector_div')
		divFileNameSelector.append(_fileNameSelector)
		divFileNameSelector.append(_fileNameExt)

		_div.append('<div>Sort</div>')
		_div.append(_outputSelector)
		_div.append(divSubFolderSelector)
		_div.append(divFileNameSelector)
	}

	this.setConfig = function(config) {
		_conf = config

		_outputSelector.empty().append('<option hidden="hidden" value=""></option>')
		for(const outConf of config.outputs) {
			_outputSelector.append(new Option(outConf.name, outConf.name))
		}
	}

	let _getUpdatedData = null
	const onChangeFolder = function() {
		const data = _getUpdatedData(true)

		// Get subfolder and songname templates according to selected output
		let templateSubfolder = _conf.defaultSongSubfolder
		let templateName = _conf.defaultSongName
		for(const outConf of _conf.outputs) {
			if(outConf.name === _outputSelector.val()) {
				if(outConf.songSubfolder)
					templateSubfolder = outConf.songSubfolder
				if(outConf.songName)
					templateName = outConf.templateName
				break
			}
		}

		// Set subfolder value
		_subfolderSelector.val((metadataTemplateStr(templateSubfolder, data) || '').replace(folderNameRestrictedChars, ''))

		// Set filename value
		_fileNameSelector.val((metadataTemplateStr(templateName, data) || '').replace(fileNameRestrictedChars, ''))
	}
	_outputSelector.change(onChangeFolder)

	this.setSongData = function(data, f_getUpdatedData) {
		_getUpdatedData = f_getUpdatedData

		// Normalize
		data.path = data.path.replace(slashes, '/')

		// If already sorted, automatically select output folder where it is sorted
		_outputSelector.val('')
		let defaultOutputValue = null
		for(const outConf of _conf.outputs) {
			if(data.path.startsWith(outConf.path.replace(slashes, '/'))) {
				_outputSelector.val(outConf.name)
				defaultOutputValue = outConf
				break
			}
		}

		if(defaultOutputValue) {
			defaultOutputValue.path = defaultOutputValue.path.replace(slashes, '/')
			// Set subfolder value
			const subFolder = data.path.slice(
				defaultOutputValue.path.length,
				defaultOutputValue.path.length + data.path.lastIndexOf('/')
			)
			_subfolderSelector.val(subFolder)

			// Set filename value
			const subName = data.path.slice(
				defaultOutputValue.path.length + data.path.lastIndexOf('/') + 1,
				defaultOutputValue.path.lastIndexOf('.')
			)
			_fileNameSelector.val(subName)
		} else {
			_outputSelector.val(_conf.autoOutput)
			onChangeFolder()
		}
		_fileNameExt.html(data.origin.slice(data.origin.lastIndexOf('.')))
	}

	this.getSelectedValues = function(isAutoMode) {
		let outputSelection = _outputSelector.val().trim()
		const folderNameSelection = _subfolderSelector.val().trim()
		const fileNameSelection = _fileNameSelector.val().trim().replace(fileNameRestrictedChars, '')
		if(isAutoMode && _conf.autoOutput && !outputSelection) {
			outputSelection = _conf.autoOutput
		}
		if(!outputSelection || !fileNameSelection) {
			return null
		}

		return (`${outputSelection}/${folderNameSelection}/${fileNameSelection}`
			.replace(folderNameRestrictedChars, '')
			.replace(slashes, '/')
			+ _fileNameExt.html())
	}
}

function metadataTemplateStr(templates, songData) {
	const artists = songData['common/artists']
	const vars = {
		title: songData['common/title'],
		subtitle: songData['common/subtitle'],
		artist: artists && artists.length ? artists[0] : null,
		artists: artists ? artists.join(', ') : null,
		albumartist: songData['common/albumartist'],
		album: songData['common/album'],
	}
	for(let t of templates) {
		const neededVars = {};
		(t.match(/\{[^}]+\}/g) || []).forEach((a) => neededVars[a.slice(1, a.length-1).toLowerCase()] = true)
		let ok = true
		for(const arg in neededVars) {
			if(!vars[arg]) {
				ok = false
				break
			}
			t = t.replace(new RegExp(`\\{${arg}\\}`, 'ig'), vars[arg])
		}
		if(ok) return t
	}
	return null
}
