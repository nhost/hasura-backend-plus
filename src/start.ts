import { app } from './server'
import { SERVER_PORT } from '@shared/config'

export const server = app.listen(SERVER_PORT, () => {
  console.log(`Running on http://localhost:${SERVER_PORT}`)
})
