import { PORT } from '@shared/config'
import { app } from './server'
import migrate from './migrate'

migrate()

export const server = app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`)
})
