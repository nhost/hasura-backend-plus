// puppeteer_environment.js
// eslint-disable-next-line
const NodeEnvironment = require('jest-environment-node')
const chalk = require('chalk')
const { getPuppeteer } = require('./getPuppeteer')
const config = require('./puppeteer.config.js')

const handleError = (error) => {
  process.emit('uncaughtException', error)
}

const KEYS = {
  CONTROL_C: '\u0003',
  CONTROL_D: '\u0004',
  ENTER: '\r'
}

class PuppeteerEnvironment extends NodeEnvironment {
  // Jest is not available here, so we have to reverse engineer
  // the setTimeout function, see https://github.com/facebook/jest/blob/v23.1.0/packages/jest-runtime/src/index.js#L823
  setTimeout(timeout) {
    if (this.global.jasmine) {
      // eslint-disable-next-line no-underscore-dangle
      this.global.jasmine.DEFAULT_TIMEOUT_INTERVAL = timeout
    } else {
      this.global[Symbol.for('TEST_TIMEOUT_SYMBOL')] = timeout
    }
  }

  async setup() {
    const puppeteer = getPuppeteer()

    const wsEndpoint = process.env.PUPPETEER_WS_ENDPOINT
    if (!wsEndpoint) {
      throw new Error('wsEndpoint not found')
    }

    this.global.jestPuppeteer = {
      debug: async () => {
        // eslint-disable-next-line no-eval
        // Set timeout to 4 days
        this.setTimeout(345600000)
        // Run a debugger (in case Puppeteer has been launched with `{ devtools: true }`)
        await this.global.page.evaluate(() => {
          // eslint-disable-next-line no-debugger
          debugger
        })
        // eslint-disable-next-line no-console
        console.log(chalk.blue('\n\n🕵️‍  Code is paused, press enter to resume'))
        // Run an infinite promise
        return new Promise((resolve) => {
          const { stdin } = process
          const onKeyPress = (key) => {
            if (key === KEYS.CONTROL_C || key === KEYS.CONTROL_D || key === KEYS.ENTER) {
              stdin.removeListener('data', onKeyPress)
              if (!listening) {
                if (stdin.isTTY) {
                  stdin.setRawMode(false)
                }
                stdin.pause()
              }
              resolve()
            }
          }
          const listening = stdin.listenerCount('data') > 0
          if (!listening) {
            if (stdin.isTTY) {
              stdin.setRawMode(true)
            }
            stdin.resume()
            stdin.setEncoding('utf8')
          }
          stdin.on('data', onKeyPress)
        })
      },
      resetPage: async () => {
        if (this.global.page) {
          await this.global.page.close()
        }
        this.global.page = await this.global.context.newPage()
      },
      resetBrowser: async () => {
        if (this.global.page) {
          await this.global.page.close()
        }
        this.global.page = null
        if (this.global.browser) {
          await this.global.browser.disconnect()
        }
        this.global.browser = await puppeteer.connect({
          ...config.launch,
          browserURL: undefined,
          browserWSEndpoint: wsEndpoint
        })
        this.global.context = await this.global.browser.browserContexts()[0]
        await this.global.jestPuppeteer.resetPage()
      }
    }

    await this.global.jestPuppeteer.resetBrowser()
  }

  async teardown() {
    const { page, browser } = this.global

    if (page) {
      page.removeListener('pageerror', handleError)
    }

    if (page) {
      await page.close()
    }

    if (browser) {
      await browser.disconnect()
    }
  }
}

module.exports = PuppeteerEnvironment
