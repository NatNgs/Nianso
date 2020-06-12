/* global bytesToBase64 */
let mediaplayer;
$(document).ready(() => {
	$('#mediaplayer').mediaelementplayer({
		alwaysShowControls: true,
		features: ['playpause','volume','progress'],
		audioVolume: 'horizontal',
		success: (player, container) => {
			mediaplayer = player;
			player.addEventListener('ended', () => {
				if($('#navAuto').is(':checked')) {
					skip();
				}
			});
		}
	});
});

let _editableFields = {};
function createPropertyLine(key, value, editionKey=null, editionType='text') {
	let displayValue;
	if(editionKey) {
		if(editionType === 'textarea') {
			displayValue = $('<textarea></textarea>').val(value);
			_editableFields[editionKey] = (() => displayValue.val());
		} else {
			displayValue = $(`<input type="${editionType}"/>`).val(value);
			if(editionType === 'number') {
				_editableFields[editionKey] = (() => +displayValue.val());
			} else {
				_editableFields[editionKey] = (() => displayValue.val());
			}
		}
	} else {
		if(editionType === 'pictures') {
			displayValue = $('<div></div>');
			for(const pictData of value) {
				if(!pictData.data || pictData.data.type !== 'Buffer') continue;

				// [{"format":"image/jpeg","type":"Cover (front)","description":"","data":{"type":"Buffer","data":[255,216,255,224,0,16,74,70,73,70
				const data = 'data:' + pictData.format + ';base64,' + bytesToBase64(pictData.data.data);
				const imagebloc = $('<div></div>').addClass('propertylinePicture');
				const image = $('<img/>').attr('src', data);
				const imageLegend = $('<span></span>').html(pictData.type || pictData.description || '');
				imagebloc.append(imageLegend);
				imagebloc.append(image);
				displayValue.append(imagebloc);
			}
		} else {
			displayValue = $('<code></code>').html(value);
		}
	}
	const propLine = $('<div></div>').addClass('dataline');
	propLine.append($('<span></span>').addClass('datalineKey').html(key));
	propLine.append(displayValue.addClass('datalineValue'));

	return propLine;
}
const spetialMetadataCommonKeys = ['artist', 'artists', 'title', 'subtitle', 'album', 'albumartist', 'rating', 'comment', 'picture'];
function setSong(data) {
	_editableFields = {};

	const container = $('#info_div').empty();
	// File name
	const folderStruct = data.path.replace(/\\+/g, '/').split('/');
	const fileName = folderStruct.pop();
	const showPath = folderStruct.join('/');
	container.append(createPropertyLine('Path', showPath));
	container.append(createPropertyLine('File', fileName));

	container.append('<hr/>');

	if(!data.metadata) data.metadata = {};
	if(!data.metadata.common) data.metadata.common = {};

	// Artists
	const artist1 = data.metadata.common.artist;
	const artists = data.metadata.common.artists || [];
	if(artist1 && artists.indexOf(artist1) < 0)
		artists.push(data.metadata.common.artist);
	container.append(createPropertyLine('Artist', artists.join(', '), 'common/artists'));

	// Title
	container.append(createPropertyLine('Title', data.metadata.common.title || '', 'common/title'));
	container.append(createPropertyLine('Subtitle', data.metadata.common.subtitle || '', 'common/subtitle'));

	container.append('<hr/>');
	// Rating
	let rating = null;
	if(data.metadata.common.rating) {
		for(const r of data.metadata.common.rating) {
			if(r.source === 'nianso') {
				rating = r.rating;
				break;
			}
			if(r.source === 'Windows Media Player 9 Series') {
				rating = r.rating * 20;
			}
		}
	}
	container.append(createPropertyLine('Rating', rating || '', 'common/rating', 'number'));

	// Comment
	container.append(createPropertyLine('Comment', (data.metadata.common.comment || []).join('\n').replace(/\r?\n\r?/g, '\n'), 'common/comment', 'textarea'));

	container.append('<hr/>');

	// Pictures
	if(data.metadata.common.picture) {
		container.append(createPropertyLine('Pictures', data.metadata.common.picture, null, 'pictures'));
	}

	// Common data
	for(const key in data.metadata.common) {
		if(spetialMetadataCommonKeys.indexOf(key) >= 0) continue;
		container.append(createPropertyLine(key, JSON.stringify(data.metadata.common[key])));
	}

	// Format data
	for(const key in data.metadata.format) {
		container.append(createPropertyLine(key, JSON.stringify(data.metadata.format[key])));
	}

	container.append('<hr/>');

	// Sorter
}

let _currSong = null;
let currSongIndex = -1;
function getSong() {
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: '/get/'+ currSongIndex,
		success: (data) => {
			_currSong = data;
			mediaplayer.pause();
			mediaplayer.setSrc(data.url);
			mediaplayer.load();
			setSong(data);
			mediaplayer.play();
		}
	});
}
function skip() { // eslint-disable-line no-unused-vars
	currSongIndex ++;
	getSong();
}
function next() { // eslint-disable-line no-unused-vars
	// Get all fields values
	const payload = {};
	for(const key in _editableFields) {
		payload[key] = _editableFields[key]();
	}

	// Post updates
	$.ajax({
		type: 'POST',
		dataType: 'json',
		url: '/update/'+ _currSong.id,
		data: JSON.stringify(payload)
	});

	skip();
}
function previous() { // eslint-disable-line no-unused-vars
	if(currSongIndex < 0)
		return;
	getSong();
}
