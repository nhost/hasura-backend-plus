import { Router } from 'express'
import revokeToken from './revoke'
import refreshToken from './refresh'
export default Router().post('/refresh', refreshToken).post('/revoke', revokeToken)
