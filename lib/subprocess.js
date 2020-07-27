const { Crawler } = require('./crawler')

const scanWebsite = async url => {
  const Crawler = new crawler(url)
  return await crawler.scanWebsite(['.zip', '.war', '.rar', '.exe', '.js', '.css', '.pdf', '.java'])
}

process.on('message', ({ type, data }) => {
  const messages = {
    start: async ({ url, id }) => {
      try {
        const json = await scanWebsite(url)
        process.send({
          type: 'complete',
          data: {
            json,
            id
          }
        })
      } catch (error) {
        process.send({
          type: 'error',
          data: {
            error,
            id
          }
        })
      }
    }
  }
  messages[type](data)
})
