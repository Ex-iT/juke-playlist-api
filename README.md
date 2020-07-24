# JUKE.nl Playlist generator

Endpoint to return the Juke Playlist as JSON or as an XSPF file.

## Usage

Install dependencies with `npm install` and run:

```
$ npm run build
```

## Endpoints

- `/.netlify/functions/server/track-list/` returns the track list as JSON
- `/.netlify/functions/server/track-list/?format=xspf` returns the XSPF file as a download
- `/.netlify/functions/server/generate/` (re)generates the JSON and XSPF files


## Development

Install dependencies with `npm install` and run:

```
$ npm start
```

This will start a server on `http://localhost:3000/` and a [nodemon](https://nodemon.io/) watcher for the `src/` folder.
