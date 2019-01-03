const fs = require('fs')
const es = require('event-stream')
const ndjson = require('ndjson')
const resource = require('fetch-resource')
const collection = require('rest-collection-stream')

const buildURL = (path, page) => {
  // const url = `https://www.bbc.co.uk/${path}.json?page=${page || 1}`
  const url = `http://clifton.api.bbci.co.uk/aps/${path}.json?page=${page || 1}`
  console.log(url)
  return url
}

const episodes = genre => {
  const url = buildURL(`programmes/genres/${genre}/player/episodes`)

  const options = {
    data: (res, body) => body.episodes,
    next: (res, body) => {
      if (body.offset + body.episodes.length >= body.total) return null

      return buildURL(`programmes/genres/${genre}/player/episodes`, body.page + 1)
    }
  }

  return collection(url, options)
    .pipe(es.map((episode, cb) => cb(null, episode.programme)))
    .pipe(ndjson.stringify())
    .pipe(fs.createWriteStream(__dirname + `/../data/${genre}.ndjson`))
}

const genres = () => resource(buildURL('programmes/genres')).fetch('json')

module.exports = { episodes, genres }
