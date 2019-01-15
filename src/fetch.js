require('axios-debug-log')
const axios = require('axios')
const axiosCollection = require('axios-collection')
const axiosRetry = require('axios-retry')
const fs = require('fs')
const http = require('http')

const client = axios.create({
  // baseURL: 'https://www.bbc.co.uk/',
  baseURL: 'http://clifton.api.bbci.co.uk/aps/',
  httpAgent: new http.Agent({ keepAlive: true })
})

axiosRetry(client, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay
})

const collection = axiosCollection(client)

// TODO: use axios rate-limiting interceptor

const buildURL = (path, page) => `${path}.json?page=${page || 1}`

const episodes = async genre => {
  const output = fs.createWriteStream(__dirname + `/../data/test/${genre}.ndjson`)

  const url = buildURL(`programmes/genres/${genre}/player/episodes`)

  const items = collection(url, {
    parse: response => response.data.episodes,
    next: response => {
      const { offset, episodes, total, page } = response.data

      if (offset + episodes.length >= total) return null

      return buildURL(`programmes/genres/${genre}/player/episodes`, page + 1)
    },
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
