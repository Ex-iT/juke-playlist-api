'use strict';
const express = require('express');
const serverless = require('serverless-http');
const path = require('path');
const fs = require('fs-extra');
const config = require('../src/config');
const generate = require('../src/generate');

const app = express();
const router = express.Router();
const defaultIndex = path.join(__dirname, '..', 'index.html');
const outputFile = config.outputFile;

router.get('/', (req, res) => res.sendFile(defaultIndex));
router.get('/generate', (req, res) => generate().then(response => res.json(response)));
router.get('/track-list/:format?', (req, res) => {
	if (req.query && req.query.format && req.query.format === 'xspf') {
		sendFile(outputFile, 'xspf', res);
	} else {
		sendFile(outputFile, 'json', res);
	}
});

app.disable('x-powered-by');
app.use(`/.netlify/functions/server`, router);
app.use('/', (req, res) => res.sendFile(defaultIndex));

app.use((req, res) => {
	res.status(404);

	res.format({
		html: function () {
			res.send('Not found');
		},
		json: function () {
			res.json({ ok: false, description: 'Not found', error: 404 });
		},
		default: function () {
			res.type('txt').send('Not found');
		}
	})
});

function sendFile(filename, extension, res) {
	const fullFilename = `${filename}.${extension}`;
	if (fs.existsSync(fullFilename)) {
		if (extension === 'xspf') {
			res.download(fullFilename, fullFilename);
		} else {
			res.sendFile(fullFilename);
		}
	} else {
		res.json({ ok: false, description: `File not found: ${fullFilename}` });
	}
}

module.exports = app;
module.exports.handler = serverless(app);
