/* global bytesToBase64 */
const spetialMetadataCommonKeys = ['artist', 'artists', 'title', 'subtitle', 'album', 'albumartist', 'rating', 'comment', 'picture']

function SongPage(data) { // eslint-disable-line no-unused-vars
	const container = $('<div></div>')
	const _editableFields = {}
	const createPropertyLine = function(key, value, editionKey=null, editionType='text') {
		let displayValue
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
		container.append(createPropertyLine('Artists', artists.join(', '), 'common/artists'))

		// Title
		container.append(createPropertyLine('Title', data.metadata.common.title || '', 'common/title'))
		container.append(createPropertyLine('Subtitle', data.metadata.common.subtitle || '', 'common/subtitle'))

		container.append('<br/>')

		// Album
		container.append(createPropertyLine('Album', data.metadata.common.album || '', 'common/album'))
		container.append(createPropertyLine(
			'Artist',
			data.metadata.common.albumartist || (artists.length && artists[0]) || '',
			'common/albumartist'
		))

		container.append('<br/>')

		// Rating
		let rating = null
		if(data.metadata.common.rating) {
			for(const r of data.metadata.common.rating) {
				if(r.source === 'nianso') {
					rating = r.rating
					break
				}
				if(r.source === 'Windows Media Player 9 Series') {
					rating = r.rating * 20
				}
			}
		}
		container.append(createPropertyLine('Rating', rating || '', 'common/rating', 'number'))

		// Comment
		container.append(createPropertyLine('Comment', (data.metadata.common.comment || []).join('\n').replace(/\r?\n\r?/g, '\n'), 'common/comment', 'textarea'))

		container.append('<br/>')

		// Pictures
		if(data.metadata.common.picture) {
			container.append(createPropertyLine('Pictures', data.metadata.common.picture, null, 'pictures'))
		}

		// Common data
		for(const key in data.metadata.common) {
			if(spetialMetadataCommonKeys.indexOf(key) >= 0) continue
			container.append(createPropertyLine(key, JSON.stringify(data.metadata.common[key])))
		}

		// Format data
		for(const key in data.metadata.format) {
			container.append(createPropertyLine(key, JSON.stringify(data.metadata.format[key])))
		}
	}

	//
	// Public

	for(const key in data) {
		this[key] = data[key]
	}
	this.div = container
	this.getEditedValues = function() {
		const values = {}
		for(const key in _editableFields) {
			values[key] = _editableFields[key]()
		}
		return values
	}

	setSong(data)
}
