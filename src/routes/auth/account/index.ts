import { Router } from 'express'

import deleteAccount from './delete'
import activateAccount from './activate'

export default Router().get('/activate', activateAccount).post('/delete', deleteAccount)
