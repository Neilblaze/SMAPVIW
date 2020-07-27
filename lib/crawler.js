const axios = require('axios')
const { JSDOM } = require("jsdom")
const { URL } = require('url')

class Crawler {
  constructor(baseURL) {
    this.baseURL = new URL(baseURL)
    this.vititedURLs = []
    this.sitemap = { url: this.baseURL, children: [] }
  }

  async downloadSite(url) {
    return (await axios.get(url, {
      maxContentLength: 10000000
    })).data
  }

  getURLs(html, skipVisited = true) {
    const { window: { document }} = new JSDOM(html)
    const urls = [...new Set([...document.querySelectorAll('a')].map(a => a.href).filter(href => !href.match(/.*about:blank.*/g)))]
    const absoluteURLs = urls.map(url => new URL(url, this.baseURL))
    return !skipVisited ? absoluteURLs : absoluteURLs.filter(url => !this.vititedURLs.includes(url.href))
  }

  async scanSubpage(parent) {
    const html = await this.downloadSite(parent.url.href)
    const urls = this.getURLs(html)
    urls.forEach(url => {
      if (!this.vititedURLs.includes(url.href)) {
        this.vititedURLs.push(url.href)
      }
    })
    const subpages = urls.map(url => ({
      url,
      children: [],
      status: 418
    }))
    Array.prototype.push.apply(parent.children, subpages)
  }

  async scanWebsite(extentions) {
    let iter = 0
    const queue = [this.sitemap]
    while (queue.length) {
      const subpage = queue.shift()
      console.warn(subpage.url.href)
      try {
         await this.scanSubpage(subpage)
         subpage.status = 200
      } catch (error) {
        console.error(`${error.response.status} ${error.response.statusText}`)
        subpage.status = error.response.status
      }
      subpage.children.forEach(child => {
        if (child.url.host === this.baseURL.host) {
          if (extentions) {
            if (extentions.every(ext => !child.url.pathname.endsWith(ext))) {
              queue.push(child)
            }
          } else {
            queue.push(child)
          }
        }
      })
      iter += 1
      if (iter > 1000) {
        break
      }
    }
    return this.sitemap
  }
}

module.exports = {
  Crawler
}
