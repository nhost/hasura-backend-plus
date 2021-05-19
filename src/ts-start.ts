import { APPLICATION } from '@shared/config'
import { app } from './server'
import { applyMigrations } from "./shared/migrations"

const start = async (): Promise<void> => {
  await applyMigrations()

  app.listen(APPLICATION.PORT, APPLICATION.HOST, () => {
    if (APPLICATION.HOST) {
      console.log(`Running on http://${APPLICATION.HOST}:${APPLICATION.PORT}`)
    } else {
      console.log(`Running on port ${APPLICATION.PORT}`)
    }
  })
}

start()
