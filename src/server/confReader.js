const config = require('./server/default_config.json');

// Get user config
try {
	const localConfig = require('./config.json');
	const mergeConfs = (map1, map2) => {
		for (const key in map2) {
			if (!map1[key] || typeof map2[key] != 'object') {
				map1[key] = map2[key];
			} else {
				mergeConfs(map1[key], map2[key]);
			}
		}
	};
	mergeConfs(config, localConfig);
} catch (e) {
	console.warn('File "server/config.json" was not found, not readable or incorrect. Using default configuration alone.');
}

module.exports = {
	config: config
}
