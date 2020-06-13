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

	this.setSongData = function(data) {
		// If already sorted, automatically select output folder where it is sorted
		_outputSelector.val('')
		let defaultOutputValue = null
		for(const outConf of _conf.outputs) {
			if(data.path.startsWith(outConf.path)) {
				_outputSelector.val(outConf.name)
				defaultOutputValue = outConf
				break
			}
		}

		if(defaultOutputValue) {
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
			// Set subfolder value
			_subfolderSelector.val(metadataTemplateStr(_conf.defaultSongSubfolder, data) || '')

			// Set filename value
			_fileNameSelector.val(metadataTemplateStr(_conf.defaultSongName, data) || '')
		}
		_fileNameExt.html(data.origin.slice(data.origin.lastIndexOf('.')))
	}

	this.getSelectedValues = function(isAutoMode) {
		if(isAutoMode && _conf.autoOutput && !_outputSelector.val()) {
			_outputSelector.val(_conf.autoOutput)
		}
		if(!_outputSelector.val() || !_fileNameSelector.val()) {
			return null
		}

		return _outputSelector.val() + ('/' + _subfolderSelector.val() + '/').replace(/\/\/+/g, '/') + _fileNameSelector.val() + _fileNameExt.html()
	}
}

function metadataTemplateStr(templates, songData) {
	const vars = {
		title: songData.metadata.common.title,
		artist: songData.metadata.common.artists && songData.metadata.common.artists.length ? songData.metadata.common.artists[0] : null,
		artists: songData.metadata.common.artists ? songData.metadata.common.artists.join(', ') : null,
		albumartist: songData.metadata.common.albumartist,
		album: songData.metadata.common.album,
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
