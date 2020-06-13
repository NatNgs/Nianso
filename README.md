# Nianso

Listen and Sort your songs folders

## Instal

### Requirements

- Windows, Linux or Mac
- [npm](https://www.npmjs.com/get-npm)

### Installation

```sh
cd <parent folder>
git clone https://github.com/NatNgs/Nianso.git Nianso
cd Nianso
npm install
```

## Configuration

If you want to update the default configuration, create the file `Nianso/src/config.json` (untracked from git).  
You may overwrite properties defined in `Nianso/src/server/default_config.json` (commited to git) for your local environment.

Values will be replaced according to the location of their keys in the JSON structure.

Example of local configuration:

```json
{
	"serverPort": 3333,
	"inputs": [
		"C:/User/Music/Folder",
		"D:/Music/To sort"
	],
	"defaultSongSubfolder": ["{albumArtist}/{album}", "{albumArtist}", "Unknown Artists"],
	"defaultSongName": ["{artists} - {title}", "{albumArtist} - {title}", "Unknown Artist - {title}", "{artists} - Unknown", "{albumArtist} - Unknown", "Unknown Artist - Unknown"],
	"outputs": [{
		"name": "Instrumental",
		"path": "D:/Music/Sorted/Instrumental"
	}, {
		"name": "Songs",
		"path": "D:/Music/Sorted/Songs"
	}, {
		"name": "Game Soundtrack",
		"path": "D:/Music/Sorted/Soundtrack/Games",
		"defaultSongSubfolder": ["{album}", "Unknown"]
	}, {
		"name": "Movie Soundtrack",
		"path": "D:/Music/Sorted/Soundtrack/Movies",
		"defaultSongSubfolder": ["{album}", "Unknown"]
	}]
}
```

## Launch server

Will open the server on your machine IP, port 3333 by default (or will use the port you defined in configuration).

```sh
# cd Nianso
npm start
```

## Connect to game

Open a browser to the page: `127.0.0.1:<server port>/`

For example if the server runs in local machine on default port, connect to `127.0.0.1:3042/` on any browser.

### Browser Compatibility:

Working fine on :
- Firefox v.77 (64x)
- Google Chrome v.83 (64x)

Older versions and other browsers to be checked.

# Development

## Code Style

Project embeds style configuration from following sources:

- [EditorConfig](https://editorconfig.org/#download)
- [ESLint](https://eslint.org/docs/user-guide/integrations)
