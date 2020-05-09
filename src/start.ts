import { PORT, AUTO_MIGRATE } from '@shared/config'
import { app } from './server'
import migrate from './migrate'

const start = async (): Promise<void> => {
  if (AUTO_MIGRATE) {
    const migrationSetup = {
      migrations: AUTO_MIGRATE === 'v1' ? './migrations-v1' : './migrations',
      // metadata: './metadata'
    }
    await migrate(migrationSetup)
  }
  app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`))
}

start()
