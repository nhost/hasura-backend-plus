// setup.js
const config = require('./puppeteer.config.js')
const { getPuppeteer } = require('./getPuppeteer.js')
let didAlreadyRunInWatchMode = false
let browser

module.exports = async function (jestConfig = {}) {
  const puppeteer = getPuppeteer()
  browser = await puppeteer.launch(config.launch)
  process.env.PUPPETEER_WS_ENDPOINT = browser.wsEndpoint()

  // If we are in watch mode, - only setupServer() once.
  if (jestConfig.watch || jestConfig.watchAll) {
    if (didAlreadyRunInWatchMode) return
    didAlreadyRunInWatchMode = true
  }

  // ? Set a superagent server here?
  //   if (config.server) {
  //     try {
  //       await setupServer(config.server)
  //     } catch (error) {
  //       if (error.code === ERROR_TIMEOUT) {
  //         console.log('')
  //         console.error(chalk.red(error.message))
  //         console.error(
  //           chalk.blue(`\n☝️ You can set "server.launchTimeout" in jest-puppeteer.config.js`)
  //         )
  //         process.exit(1)
  //       }
  //       if (error.code === ERROR_NO_COMMAND) {
  //         console.log('')
  //         console.error(chalk.red(error.message))
  //         console.error(chalk.blue(`\n☝️ You must set "server.command" in jest-puppeteer.config.js`))
  //         process.exit(1)
  //       }
  //       throw error
  //     }
  //   }
}
