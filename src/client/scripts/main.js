let mediaplayer;
$(document).ready(() => {
	$('#mediaplayer').mediaelementplayer({
		alwaysShowControls: true,
		features: ['playpause','volume','progress'],
		audioVolume: 'horizontal',
		success: (player, container) => {
			mediaplayer = player;
			player.addEventListener('ended', next);
			next();
		}
	});
});

let currSongIndex = -1;
function getSong() {
	$.ajax({
		type: 'GET',
		dataType: 'json',
		url: '/get/'+ currSongIndex,
		success: (data) => {
			console.log(data);
			mediaplayer.pause();
			mediaplayer.setSrc(data.url);
			mediaplayer.load();
			mediaplayer.play();
		}
	});
}
function next() { // eslint-disable-line no-unused-vars
	currSongIndex ++;
	getSong();
}
function previous() { // eslint-disable-line no-unused-vars
	if(currSongIndex < 0)
		return;
	getSong();
}
