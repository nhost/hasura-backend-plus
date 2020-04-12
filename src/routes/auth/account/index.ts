import { Router } from 'express'

import deleteAccount from './delete'
import activateAccount from './activate'
import { AUTH_AUTO_ACTIVATE_NEW_USERS } from '@shared/config'

const router = Router()

if (!AUTH_AUTO_ACTIVATE_NEW_USERS) {
  router.get('/activate', activateAccount)
}

router.post('/delete', deleteAccount)

export default router
