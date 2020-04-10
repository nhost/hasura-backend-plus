import { Router } from 'express'

import github from './github'

export default Router().use('/github', github)
