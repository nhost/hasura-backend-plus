import { AUTO_ACTIVATE_NEW_USERS, ALLOW_USER_SELF_DELETE } from '@shared/config'
import { Router } from 'express'
import activateAccount from './activate'
import deleteAccount from './delete'

const router = Router()

if (!AUTO_ACTIVATE_NEW_USERS) {
  router.get('/activate', activateAccount)
}

if (ALLOW_USER_SELF_DELETE) {
  router.post('/delete', deleteAccount)
}

export default router
