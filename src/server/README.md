# Metadata format

```js
{
	format: {
		tagTypes: [ 'ID3v2.3','ID3v2.3','APEv2','ID3v1' ],
		trackInfo: [],
		lossless: false,
		container: 'MPEG',
		codec: 'MPEG 1 Layer 3',
		codecProfile: 'CBR',
		sampleRate: 44100,
		numberOfChannels: 2,
		bitrate: 160000,
		numberOfSamples: 9243648,
		duration: 209.6065306122449,
		tool: 'LAME 3.99.5',
	},
	native: { 'ID3v2.3': [ [Object], ... ], APEv2: [ [Object], ... ], ID3v1: [ [Object], ... ] },
	quality: { warnings: [ [Object], ... ] },
	common: {
		track: { no: 3, of: 7 },
		disk: { no: 1, of: 2 },
		artist: 'Stromae',
		artists: ['Stromae', ... ],
		composer: [
			'Cathy Dennis',
			'Katy Perry',
			'Lukasz "Doctor Luke" Gottwald',
			'Max Martin'
		],
		title: 'Papaoutai',
		bpm: '115.02',
		year: 2003
		genre: [ 'dance', ... ]
		picture: [ [Object], ... ],
		label: [ 'RCA', ... ],
		album: '1000 Forms of Fear',
		albumartist: 'Sia',
		encodedby: 'Online Media Technologies',
		encodersettings: '(C) eRightSoft',
		replaygain_track_minmax: [ 78, 210 ],
		replaygain_track_gain: { dB: -8.47, ratio: 0.14223287871228196 },
		replaygain_track_peak: { dB: 0.24118537834334913, ratio: 1.057106 },
		comment: [ 'Some comment', ... ],
		copyright: '(C) 2008 Capitol Records, LLC',
	}
}
```
