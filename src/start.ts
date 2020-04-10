import { SERVER_PORT } from '@shared/config'
import { app } from './server'

export const server = app.listen(SERVER_PORT, () => {
  console.log(`1 Running on http://localhost:${SERVER_PORT}`)
})
