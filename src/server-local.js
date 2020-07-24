'use strict';
const app = require('../express/server');
const config = require('./config');

const port = config.port || 3000;

app.listen(port, () => console.log(`[+] Serving on http://localhost:${port}/`));
