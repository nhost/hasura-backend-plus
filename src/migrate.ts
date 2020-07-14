import { spawn } from 'child_process'
import fetch from 'node-fetch'
import { writeFileSync } from 'fs'
import { copy, remove, pathExists, emptyDir } from 'fs-extra'
import url from 'url'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'
import TMP from 'temp-dir'
import { HASURA_ENDPOINT, HASURA_GRAPHQL_ADMIN_SECRET, HOST, PORT } from '@shared/config'
import getJwks from './routes/auth/jwks'

const LOG_LEVEL = process.env.NODE_ENV === 'production' ? 'ERROR' : 'INFO'
const TEMP_MIGRATION_DIR = `${TMP}/hasura-backend-plus-temp-migrations`

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

const hasuraConsole = async (action: string): Promise<void> => {
  try {
    const child = spawn('./node_modules/.bin/hasura', [
      ...action.split(' '),
      '--log-level',
      LOG_LEVEL,
      '--skip-update-check',
      '--project',
      TEMP_MIGRATION_DIR
    ])
    for await (const data of child.stdout) {
      process.stdout.write(data.toString())
    }
  } catch (error) {
    console.log('Error in starting hasura cli')
    console.log(error)
  }
}

type Migration = {
  migrations?: string
  metadata?: string
}

export default async (
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  { migrations, metadata }: Migration = { migrations: './migrations', metadata: './metadata' }
): Promise<void> => {
  console.log('Checking migrations and metadata...')
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
      const server = app.listen(PORT, HOST, async () => {
        const { protocol, host } = url.parse(HASURA_ENDPOINT)
        const hasuraURL = `${protocol}//${host}`
        // * Wait for GraphQL Engine to be ready
        await waitFor(`${hasuraURL}/healthz`)
        // * Empty or create the temporary directory
        await emptyDir(TEMP_MIGRATION_DIR)
        // * Set the Hasura CLI config.yaml file
        writeFileSync(
          `${TEMP_MIGRATION_DIR}/config.yaml`,
          // * HBP uses config v1 so far
          // `version: 2\nendpoint: ${hasuraURL}\nadmin_secret: ${HASURA_GRAPHQL_ADMIN_SECRET}\nmetadata_directory: metadata\nenable_telemetry: false`,
          `version: 1\nendpoint: ${hasuraURL}\nadmin_secret: ${HASURA_GRAPHQL_ADMIN_SECRET}\nmetadata_directory: metadata\nenable_telemetry: false`,
          { encoding: 'utf8' }
        )
        if (migrations && (await pathExists(migrations))) {
          // * Apply migrations
          console.log(`Applying migrations '${migrations}'...`)
          await copy(migrations, `${TEMP_MIGRATION_DIR}/migrations`)
          await hasuraConsole('migrate apply')
        }
        // * Metadata is used in config v2. HBP uses config v1 so far
        // if (metadata && (await pathExists(metadata))) {
        //   // * Apply metadata
        //   console.log(`Applying metadata '${metadata}'...`)
        //   await copy(metadata, `${TEMP_MIGRATION_DIR}/metadata`)
        //   await hasuraConsole('metadata apply')
        // } else if (migrations && (await pathExists(migrations))) {
        console.log('Reloading metadata...')
        await hasuraConsole('metadata reload')
        // }
        await remove(TEMP_MIGRATION_DIR)
        server.close()
      })
      server.on('close', () => resolve())
    } catch (err) {
      reject(err)
    }
  })
}
