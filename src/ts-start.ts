import { HOST, PORT, AUTO_MIGRATE } from '@shared/config'
import { app } from './server'
import migrate from './migrate'

const start = async (): Promise<void> => {
  if (AUTO_MIGRATE) {
    const migrationSetup = {
      migrations: AUTO_MIGRATE === 'v1' ? './migrations-v1' : './migrations'
      // metadata: './metadata'
    }
    await migrate(migrationSetup)
  }
  app.listen(PORT, HOST, () => {
    if (HOST) {
      console.log(`Running on http://${HOST}:${PORT}`)
    } else {
      console.log(`Running on port ${PORT}`)
    }
  })
}

start()
