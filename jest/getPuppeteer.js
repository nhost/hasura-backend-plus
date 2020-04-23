function getPuppeteer() {
  const puppeteer = require('puppeteer-extra')
  const StealthPlugin = require('puppeteer-extra-plugin-stealth')
  puppeteer.use(StealthPlugin())
  return puppeteer
}

module.exports.getPuppeteer = getPuppeteer
