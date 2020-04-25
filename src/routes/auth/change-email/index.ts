import { Router } from 'express'
import request from './request'
import change from './change'

export default Router().post('/request', request).post('/change', change)
