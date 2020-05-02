require('tsconfig-paths/register')
import puppeteer, { PuppeteerExtra } from 'puppeteer-extra'
import StealthPlugin from 'puppeteer-extra-plugin-stealth'

export const getPuppeteer = (): PuppeteerExtra => {
  puppeteer.use(StealthPlugin())
  return puppeteer
}
