require('tsconfig-paths/register')
// const { teardown: teardownServer } = require('jest-dev-server')
import { Config } from '@jest/types'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default async (_jestConfig: Config.InitialOptions = {}): Promise<void> => {
  //   if (!jestConfig.watch && !jestConfig.watchAll) {
  //     await teardownServer()
  //   }
}
