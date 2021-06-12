import { Router } from 'express'
import auth from './auth'
import storage from './storage'
import boom = require('express-boom')

const router = Router()

router.use(boom())

router.use('/auth', auth)

router.use('/storage', storage)

router.get('/healthz', (_req, res) => res.send('OK'))
router.get('/version', (_req, res) =>
  res.send(JSON.stringify({ version: 'v' + process.env.npm_package_version }))
)

// THESE ENDPOINTs ARE ONLY TO BE USED FOR TESTS!!
// They allows us to programmatically enable/disable
// functionality needed for specific tests.
if (process.env.NODE_ENV !== 'production') {
  router.post('/change-env', (req, res) => {
    Object.assign(process.env, req.body)
    res.json(req.body)
  })

  router.get('/env/:id', (req, res) => {
    res.send(process.env[req.params.id])
  })
}

// all other routes should throw 404 not found
router.use('*', (rwq, res) => {
  return res.boom.notFound()
})

export default router
