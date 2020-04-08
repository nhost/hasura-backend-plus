import { PORT } from '@shared/config'
import { app } from './server'

export const server = app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`)
})
