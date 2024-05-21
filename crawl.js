import { JSDOM } from 'jsdom'



function normalizeURL(urlString) {
  const urlObj = new URL(urlString)
  let fullPath = `${urlObj.host}${urlObj.pathname}`
  if (fullPath.slice(-1) === '/'){
    fullPath = fullPath .slice(0, -1)
  }
  return fullPath
}

function getURLsFromHTML(html, baseURL) {
  const urls = []
  const dom = new JSDOM(html)
  const anchors = dom.window.document.querySelectorAll('a')

  for (const anchor of anchors) {
    if (anchor.hasAttribute('href')) {
      let href = anchor.getAttribute('href')

      try {
        // convert any relative URLs to absolute URLs
        href = new URL(href, baseURL).href
        urls.push(href)
      } catch(err) {
        console.log(`${err.message}: ${href}`)
      }
    }
  }

  return urls
}

async function fetchParseHTML(url) {
  console.log(`crawling ${url}`)

  let res
  try {
    res = await fetch(url)
  } catch(err) {
    throw new Error(`Network error: ${err.message}`)
  }
  if (res.status > 399) {
    throw new Error(`Got HTTP error: ${res.status} ${res.statusText}`)
  }
  const contentType = res.headers.get('content-type')
  if (!contentType || !contentType.includes('text/html')) {
    throw new Error(`Got non-HTML response: ${contentType}`)
  }
  return res.text()

}

async function crawlPage(baseURL, currentURL=baseURL, pages={}) {
  
  const baseURLObj = new URL(baseURL)
  const currentURLObj = new URL(currentURL)
  if (baseURLObj.hostname !== currentURLObj.hostname) {
    return pages
  }

  let normalCurrentURL = normalizeURL(currentURL)
  if (normalCurrentURL in pages) {
    pages[normalCurrentURL]++
    return pages
  } else {
    pages[normalCurrentURL] = 1
  }
  
  let html = ''
  try {
    html = await fetchParseHTML(currentURL)
  } catch (err) {
    console.log(`${err.message}`)
    return pages
  }

  const urls = getURLsFromHTML(html, baseURL)
  for (let url of urls) {
    await crawlPage(baseURL, url, pages)
  }
  return pages
}

// crawlPage('https://wagslane.dev')

export { normalizeURL, getURLsFromHTML, crawlPage };

