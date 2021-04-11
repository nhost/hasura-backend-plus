import { Router } from 'express'

import lost from './lost'
import change from './change'
import reset from './reset'

const router = Router()

router.post('/', change)

router.post('/request', lost)
router.post('/change', reset)

export default router
