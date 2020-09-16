import { Router } from 'express'
import refreshToken from './refresh'
import revokeToken from './revoke'

export default Router().get('/refresh', refreshToken).post('/revoke', revokeToken)
