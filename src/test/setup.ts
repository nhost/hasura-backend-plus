require('tsconfig-paths/register')
import config from './puppeteer.config.json'
import { getPuppeteer } from './getPuppeteer'
let didAlreadyRunInWatchMode = false
let browser
import { Config } from '@jest/types'
import migrate from '../migrate'

export default async (jestConfig: Config.InitialOptions = {}): Promise<void> => {
  console.log()
  await migrate()
  await migrate('./test-mocks')
  const puppeteer = getPuppeteer()
  try {
    browser = await puppeteer.launch(config.launch)
  } catch {
    browser = await puppeteer.launch({ ...config.launch, executablePath: undefined })
  }
  process.env.PUPPETEER_WS_ENDPOINT = browser.wsEndpoint()

  // If we are in watch mode, - only setupServer() once.
  if (jestConfig.watch || jestConfig.watchAll) {
    if (didAlreadyRunInWatchMode) return
    didAlreadyRunInWatchMode = true
  }

  // ? Set a superagent server here?
}
