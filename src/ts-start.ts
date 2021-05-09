import { APPLICATION } from '@shared/config'
import { app } from './server'
import migrate from './migrate'

const start = async (): Promise<void> => {
  if (APPLICATION.AUTO_MIGRATE) {
    const migrationSetup = {
      migrations: APPLICATION.AUTO_MIGRATE === 'v1' ? './migrations-v1' : './migrations'
      // metadata: './metadata'
    }
    await migrate(migrationSetup)
  }
  app.listen(APPLICATION.PORT, APPLICATION.HOST, () => {
    if (APPLICATION.HOST) {
      console.log(`Running on http://${APPLICATION.HOST}:${APPLICATION.PORT}`)
    } else {
      console.log(`Running on port ${APPLICATION.PORT}`)
    }
  })
}

start()
