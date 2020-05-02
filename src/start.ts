import { PORT } from '@shared/config'
import { app } from './server'
import migrate from './migrate'

migrate().then(() => app.listen(PORT, () => console.log(`Running on http://localhost:${PORT}`)))
