/* global bytesToBase64 */
const specialMetadataCommonKeys = [
	'artist', 'artists',
	'title', 'subtitle',
	'album', 'albumartist',
	'genre', 'year', 'rating', 'comment', 'picture', 'duration',
	'language', 'composer', 'conductor', 'publisher', 'encodedBy', 'copyright'
]

function SongPage(data) { // eslint-disable-line no-unused-vars
	const container = $('<div></div>')
	const _editableFields = {}
	const createPropertyLine = function(key, value, editionKey=null, editionType='text') {
		let displayValue
		if(editionKey) {
			if(editionType === 'textarea') {
				displayValue = $('<textarea></textarea>').val(('' + value).trim())
				_editableFields[editionKey] = (() => displayValue.val().trim())
			} else if(editionType === 'text') {
				displayValue = $('<input type="text"/>').val(('' + value).trim())
				_editableFields[editionKey] = (() => displayValue.val().trim())
			} else if(editionType === 'number') {
				displayValue = $('<input type="number" class="dataNum"/>').val(+value)
				_editableFields[editionKey] = (() => +displayValue.val())
			} else if(editionType === 'list') {
				value = (value.join ? value : [value]).map((a) => a.trim()).filter((a) => a).sort().join(', ')
				displayValue = $('<input type="text" class="dataList"/>').val(value)
				_editableFields[editionKey] = (() => displayValue.val().split(/[,;]+/g).map((e) => e.trim()).filter((e) => e).sort())
			} else {
				displayValue = $(`<input type="${editionType}"/>`).val(value.trim())
				_editableFields[editionKey] = (() => displayValue.val().trim())
			}
		} else {
			if(editionType === 'pictures') {
				displayValue = $('<div></div>')
				for(const pictData of value) {
					if(!pictData.data || pictData.data.type !== 'Buffer') continue

					// [{"format":"image/jpeg","type":"Cover (front)","description":"","data":{"type":"Buffer","data":[255,216,255,224,0,16,74,70,73,70
					const data = 'data:' + pictData.format + ';base64,' + bytesToBase64(pictData.data.data)
					const imagebloc = $('<div></div>').addClass('propertylinePicture')
					const image = $('<img/>').attr('src', data)
					const imageLegend = $('<span></span>').html(pictData.type || pictData.description || '')
					imagebloc.append(imageLegend)
					imagebloc.append(image)
					displayValue.append(imagebloc)
				}
			} else {
				displayValue = $('<code></code>').html(value)
			}
		}
		const propLine = $('<div></div>').addClass('dataline')
		propLine.append($('<span></span>').addClass('datalineKey').html(key))
		propLine.append(displayValue.addClass('datalineValue'))

		return propLine
	}

	const setSong = function(data) {
		// File name
		const folderStruct = data.path.replace(/\\+/g, '/').split('/')
		const fileName = folderStruct.pop()
		const showPath = folderStruct.join('/')
		container.append(createPropertyLine('Path', showPath))
		container.append(createPropertyLine('File', fileName))

		container.append('<br/>')

		if(!data.metadata) data.metadata = {}
		if(!data.metadata.common) data.metadata.common = {}

		// Artists
		const artist1 = data.metadata.common.artist
		const artists = data.metadata.common.artists || []
		if(artist1 && artists.indexOf(artist1) < 0)
			artists.push(data.metadata.common.artist)
		container.append(createPropertyLine('Artists', artists, 'common/artists', 'list'))

		// Title
		container.append(createPropertyLine('Title', data.metadata.common.title || '', 'common/title'))
		container.append(createPropertyLine('Subtitle', data.metadata.common.subtitle || '', 'common/subtitle'))
		container.append(createPropertyLine('Genres', data.metadata.common.genre, 'common/genre', 'list'))

		container.append('<br/>')

		// Album
		container.append(createPropertyLine('Album', data.metadata.common.album || '', 'common/album'))
		container.append(createPropertyLine(
			'Album Artist',
			data.metadata.common.albumartist || (artists.length && artists[0]) || ''
		))

		container.append('<br/>')

		// Other editable data
		container.append(createPropertyLine('Year', data.metadata.common.year || '', 'common/year'))
		container.append(createPropertyLine('Languages', data.metadata.common.language || '', 'common/language', 'list'))
		container.append(createPropertyLine('Composers', data.metadata.common.composer || '', 'common/composer', 'list'))
		container.append(createPropertyLine('Conductor', data.metadata.common.conductor || '', 'common/conductor'))
		container.append(createPropertyLine('Publisher', data.metadata.common.publisher || '', 'common/publisher'))
		container.append(createPropertyLine('Encoded by', data.metadata.common.encodedBy || '', 'common/encodedby'))
		container.append(createPropertyLine('Copyright', data.metadata.common.copyright || '', 'common/copyright'))

		container.append('<br/>')

		// Duration
		if(data.metadata.format.duration) {
			const hours = String((data.metadata.format.duration/3600) |0).padStart(2, '0')
			const mins = String(((data.metadata.format.duration % 3600)/60) |0).padStart(2, '0')
			const secs = String((data.metadata.format.duration % 60) |0).padStart(2, '0')
			const ms = String(((data.metadata.format.duration - (data.metadata.format.duration |0))*1000) |0).padStart(3, '0')
			container.append(createPropertyLine(
				'Duration',
				`${hours}:${mins}:${secs}.${ms} (${data.metadata.format.duration.toFixed(3)}s)`
			))
		}

		// Pictures
		if(data.metadata.common.picture) {
			container.append(createPropertyLine('Pictures', data.metadata.common.picture, null, 'pictures'))
		}

		// Rating
		let rating = null
		if(data.metadata.common.rating) {
			for(const r of data.metadata.common.rating) {
				if(r.source === 'nianso') {
					rating = r.rating
					break
				}
				if(r.source === 'Windows Media Player 9 Series') {
					rating = r.rating * 20 | 0
				}
			}
		}
		container.append(createPropertyLine('Rating', rating || ''))

		// Common data
		for(const key in data.metadata.common) {
			if(specialMetadataCommonKeys.indexOf(key) >= 0) continue
			container.append(createPropertyLine(key, JSON.stringify(data.metadata.common[key])))
		}

		// Format data
		for(const key in data.metadata.format) {
			if(specialMetadataCommonKeys.indexOf(key) >= 0) continue
			container.append(createPropertyLine(key, JSON.stringify(data.metadata.format[key])))
		}
	}

	//
	// Public

	for(const key in data) {
		this[key] = data[key]
	}
	this.div = container
	this.getEditedValues = function(withUnedited=false) {
		const values = {}
		if(withUnedited) {
			for(const key in data.metadata.common) {
				values['common/'+key] = data.metadata.common[key]
			}
			for(const key in data.metadata.common) {
				values['format/'+key] = data.metadata.format[key]
			}
		}
		for(const key in _editableFields) {
			values[key] = _editableFields[key]()
		}
		return values
	}

	setSong(data)
}
