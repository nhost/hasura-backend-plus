import { spawnSync } from 'child_process'
import fetch from 'node-fetch'
import { writeFileSync } from 'fs'
import url from 'url'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { HASURA_ENDPOINT, HASURA_GRAPHQL_ADMIN_SECRET, AUTO_MIGRATE, PORT } from '@shared/config'
import getJwks from './routes/auth/jwks'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async (path: string, attempts = 240): Promise<void> => {
  if (attempts > 0) {
    try {
      if ((await fetch(path)).status !== 200) {
        await sleep(1000)
        await waitFor(path, attempts--)
      }
    } catch (error) {
      await sleep(1000)
      await waitFor(path, attempts--)
    }
  } else throw Error(`Unable to reach ${path}`)
}

export default async (): Promise<void> => {
  if (AUTO_MIGRATE) {
    console.log('Applying migrations...')
    await new Promise((resolve, reject) => {
      const app = express()
      app.use(helmet())
      app.use(cors())
      app.get('/auth/jwks', getJwks)
      /**
       * ! See: https://github.com/hasura/graphql-engine/issues/3636
       * ! When Hasura is set to use jwk_url with HBP, it needs to get the JWKS from HBP to start.
       * ! As we need Hasura to be up to run the migrations, we provide a temporary server with only the JWKS endpoint.
       */
      try {
        const server = app.listen(PORT, async () => {
          const { protocol, host } = url.parse(HASURA_ENDPOINT)
          const hasuraURL = `${protocol}//${host}`
          // * Wait for GraphQL Engine to be ready
          console.log('Waiting for Hasura to be ready...')
          await waitFor(`${hasuraURL}/healthz`)
          // * Set the Hasura CLI config.yaml file
          writeFileSync(
            'config.yaml',
            `endpoint: ${hasuraURL}\nadmin_secret: ${HASURA_GRAPHQL_ADMIN_SECRET}\n`,
            { encoding: 'utf8' }
          )
          // * Apply migrations
          const { error, stdout } = spawnSync('./node_modules/.bin/hasura', [
            'migrate',
            'apply',
            '--skip-update-check'
          ])
          if (error) reject(error)
          console.log(stdout.toString())
          server.close()
        })
        server.on('close', () => resolve())
      } catch (err) {
        reject(err)
      }
    })
  }
}
