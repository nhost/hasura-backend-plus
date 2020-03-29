import { Router } from 'express'

import getFile from './file'
import getFileMeta from './meta'
import deleteFile from './delete'
import uploadFile from './upload'
import revokeFile from './revoke'
export default Router()
  .delete('/file/*', deleteFile)
  .get('/file-meta/*', getFileMeta)
  .get('/file/*', getFile)
  .post('/revoke/*', revokeFile)
  .post('/upload', uploadFile)
