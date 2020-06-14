/* global SongPage, FolderSelect */
const _folderSelect = new FolderSelect()
let _mediaplayer
let _currSong = null

$(document).ready(() => {
	$('#navSortAuto').click(() => {
		$('#navSkipAuto').prop('checked', false)
	})
	$('#navSkipAuto').click(() => {
		$('#navSortAuto').prop('checked', false)
	})

	$('#mediaplayer').mediaelementplayer({
		alwaysShowControls: true,
		features: ['playpause','volume','progress'],
		audioVolume: 'horizontal',
		success: (player, container) => {
			_mediaplayer = player
			player.addEventListener('ended', () => {
				if($('#navSkipAuto').is(':checked')) {
					skip()
				} else if($('#navSortAuto').is(':checked')) {
					applyChanges(true)
					skip()
				}
			})
		}
	})

	_folderSelect.setContainer($('#move_div'))

	// Get output folders
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: '/data/config.json',
		success: (data) => {
			_folderSelect.setConfig(data)
		}
	})
})

let currSongIndex = -1
function getSong(index, isAutoMode=false) {
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: `/get/${index}`,
		success: (data) => {
			currSongIndex = data.orderIndex
			_mediaplayer.pause()
			_mediaplayer.setSrc(data.url)
			_mediaplayer.load()
			_currSong = new SongPage(data)
			$('#info_div').empty().append(_currSong.div)
			$('#trackNb').html(data.orderIndex + ' / ' + data.orderIndexOver)
			_folderSelect.setSongData(data, isAutoMode)
			_mediaplayer.play()
		}
	})
}

//
// Exported functions (within HTML)

function skip() { // eslint-disable-line no-unused-vars
	getSong('next', $('#navSortAuto').is(':checked'))
}
function applyChanges(isAutoMode = false) { // eslint-disable-line no-unused-vars
	const payload = _currSong.getEditedValues()
	payload['path'] = _folderSelect.getSelectedValues(isAutoMode)
	// Post updates
	$.ajax({
		type: 'POST',
		dataType: 'json',
		url: '/update/'+ _currSong.id,
		data: JSON.stringify(payload)
	})
}
function previous() { // eslint-disable-line no-unused-vars
	if(currSongIndex <= 0)
		return
	currSongIndex --
	getSong(currSongIndex)
}
