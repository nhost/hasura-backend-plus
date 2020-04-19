import { AUTO_ACTIVATE_NEW_USERS } from '@shared/config'
import { Router } from 'express'
import activateAccount from './activate'
import deleteAccount from './delete'

const router = Router()

if (!AUTO_ACTIVATE_NEW_USERS) {
  router.get('/activate', activateAccount)
}

router.post('/delete', deleteAccount)

export default router
