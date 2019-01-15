require('axios-debug-log')
const fs = require('fs')
const collection = require('axios-collection')

// TODO: use axios retry and rate-limiting interceptors

const buildURL = (path, page) => `http://clifton.api.bbci.co.uk/aps/${path}.json?page=${page || 1}`
// `https://www.bbc.co.uk/${path}.json?page=${page || 1}`

const episodes = async genre => {
  const output = fs.createWriteStream(__dirname + `/../data/genres/${genre}.ndjson`)

  const url = buildURL(`programmes/genres/${genre}/player/episodes`)

  const items = collection(url, {
    parse: response => response.data.episodes,
    next: response => {
      const { offset, episodes, total, page } = response.data

      if (offset + episodes.length >= total) return null

      return buildURL(`programmes/genres/${genre}/player/episodes`, page + 1)
    }
  })

  for await (const item of items) {
    output.write(JSON.stringify(item.programme) + '\n')
  }
}

const fetch = async () => {
  const url = buildURL('programmes/genres')

  const items = collection(url, {
    parse: response => response.data.categories,
  })

  for await (const item of items) {
    if (item.narrower) {
      await episodes(item.key)
    }
  }
}

fetch().then(() => {
  console.log('Finished')
}).catch(error => {
  console.error(error)
})
