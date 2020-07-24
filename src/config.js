const path = require('path');

module.exports = {
	port: 3000,
	filename: 'juke-stations',
	jukeProfile: 'juke-web',
	outputFile: path.join(__dirname, '..', 'static', 'juke-stations'),
	apiKey: 'da2-evfzzjsvjjhy3isb6ursfis2ue',
	urlStations: `https://static.juke.nl/content/stations.json?preventCache=${new Date().getTime()}`,
	urlStationBase: 'https://graph.talparad.io/',
	urlStream: 'https://playerservices.streamtheworld.com/api/livestream-redirect/',
	playlistTitle: 'JUKE.nl Stations',
	playlistCreator: 'JUKE Playlist Generator',
	playlistInfo: 'https://github.com/Ex-iT/'
}

