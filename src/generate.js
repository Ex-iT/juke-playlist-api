'use strict';
const fs = require('fs-extra');
const fetch = require('isomorphic-fetch');
const config = require('./config');

const {
	urlStations,
	urlStationBase,
	urlStream,
	apiKey,
	jukeProfile,
	outputFile,
	playlistTitle,
	playlistCreator,
	playlistInfo
} = config

const returnObject = {
	ok: false,
	description: '',
	json: '',
	xspf: '',
	playlists: []
}

function generate() {
	return new Promise((resolve, reject) => {
		fetchJson(urlStations)
			.then(response => JSON.parse(response))
			.then(stations => {
				const stationDataPromises = stations
					.map(station => ({ slug: station.slug, description: station.metadata ? station.metadata.description : '' }))
					.map(metaData => getStationData(metaData.slug, metaData.description, jukeProfile).then(station => station));

				Promise.all(stationDataPromises).then(stationsData => {
					const tracks = generateTracks(stationsData.filter(Boolean));
					Promise.all([generatePlaylist(tracks), generatePlaylistJSON(tracks)])
						.then(([xspf, json]) => {
							returnObject.ok = true;
							returnObject.description = `Playlists saved to: ${outputFile}.(json|xspf)`;
							returnObject.playlists = [`${outputFile}.json`, `${outputFile}.xspf`]
							returnObject.json = json;
							returnObject.xspf = xspf;
							resolve(returnObject);
						})
						.catch(error => {
							returnObject.ok = false;
							returnObject.description = `An error occured writing the file: ${error}`;
							reject(returnObject);
						});
				});
			})
			.catch(error => {
				returnObject.ok = false;
				returnObject.description = `An error occured while trying to get the stations: ${error}`;
				reject(returnObject);
			});
		});
}

function getStationData(slug, metaDescription, profile) {
	const urlStation = `${urlStationBase}?query=query+GetStation($profile:+String!,+$slug:+String!)+%7B%0A++station:+getStation(profile:+$profile,+slug:+$slug)+%7B%0A++++id%0A++++type%0A++++title%0A++++description%0A++++shortTitle%0A++++slug%0A++++media+%7B%0A++++++...MediaFragment%0A++++%7D%0A++++images+%7B%0A++++++...ImageFragment%0A++++%7D%0A++++tags+%7B%0A++++++slug%0A++++++title%0A++++++type%0A++++%7D%0A++++config+%7B%0A++++++type%0A++++++entries+%7B%0A++++++++key%0A++++++++value%0A++++++++type%0A++++++%7D%0A++++%7D%0A++%7D%0A%7D%0A%0Afragment+MediaFragment+on+Media+%7B%0A++uri%0A++source%0A%7D%0A%0Afragment+ImageFragment+on+Image+%7B%0A++uri%0A++imageType%0A++title%0A%7D%0A&variables=%7B%22profile%22:%22${profile}%22,%22slug%22:%22${slug}%22%7D`;
	const options = { headers: { 'x-api-key': apiKey } };

	return fetchJson(urlStation, options)
		.then(response => JSON.parse(response))
		.then(json => json.data.station ? json.data.station : null)
		.then(station => {
			if (station) {
				station.metaDescription = metaDescription;
				return station;
			}
		});
}

function generateTracks(stationsData) {
	return stationsData
		.filter(stationData => stationData.media.length)
		.map(stationData => {
			const { media, images } = stationData;
			const logo = images.filter(image => image.imageType === 'logo');
			let location = media.length ? media[0].uri : '';
			location = /^[^http]/i.test(location) ? (urlStream + location) : location;

			return {
				title: encodeHtml(stationData.title || station.slug),
				info: encodeHtml(stationsData.description || stationData.shortTitle || stationData.metaDescription || ''),
				image: cleanImageUrl(logo.length ? logo[0].uri : (images[0].uri || '')),
				media: encodeHtml(location)
			};
		}).sort((a, b) => {
			if (a.title.toLowerCase() < b.title.toLowerCase()) return -1;
			if (a.title.toLowerCase() > b.title.toLowerCase()) return 1;
			return 0;
		});
}

function generatePlaylistJSON(tracks) {
	const data = {
		title: playlistTitle,
		creator: playlistCreator,
		info: playlistInfo,
		date: new Date().toISOString(),
		trackList: tracks.map(({ title, info, image, media }) => {
			return {
				title,
				info,
				image,
				location: media
			}
		})
	};

	return JSON.stringify(data);

	// return fs.writeFile(`${outputFile}.json`, JSON.stringify(data));
}

function generatePlaylist(tracks) {
	const data = `<?xml version="1.0" encoding="UTF-8"?>
<playlist version="1" xmlns="http://xspf.org/ns/0/">
	<title>${playlistTitle}</title>
	<creator>${playlistCreator}</creator>
	<info>${playlistInfo}</info>
	<date>${new Date().toISOString()}</date>
	<trackList>
		${tracks.map(track => `<track>
			<title>${track.title}</title>
			<info>${track.info}</info>
			<image>${track.image}</image>
			<location>${track.media}</location>
		</track>`).join('\n\t\t')}
	</trackList>
</playlist>`;

	return data;

	// return fs.writeFile(`${outputFile}.xspf`, data);
}

function fetchJson(url, options = {}) {
	return new Promise((resolve, reject) => {
		fetch(url, options)
			.then(response => response.text())
			.then(json => resolve(json))
			.catch(error => reject(error));
	});
}

function encodeHtml(str) {
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
}

function cleanImageUrl(url) {
	const matchIndex = url.indexOf('?');
	return url.substring(0, matchIndex != -1 ? matchIndex : url.length);
}

module.exports = generate;
