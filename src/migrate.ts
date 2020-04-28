import { HASURA_ENDPOINT, HASURA_GRAPHQL_ADMIN_SECRET, AUTO_MIGRATE } from '@shared/config'
import { spawnSync } from 'child_process'
import fetch from 'node-fetch'
import { writeFileSync } from 'fs'
import url from 'url'

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async (path: string, attempts = 20): Promise<void> => {
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

const gqlEndpoint = url.parse(HASURA_ENDPOINT)
const endpoint = `${gqlEndpoint.protocol}//${gqlEndpoint.host}`

const migrate = async (): Promise<void> => {
  if (AUTO_MIGRATE) {
    // * Wait for GraphQL Engine to be ready
    await waitFor(`${endpoint}/healthz`)
    // * Set the Hasura CLI config.yaml file
    await writeFileSync(
      'config.yaml',
      `endpoint: ${endpoint}\nadmin_secret: ${HASURA_GRAPHQL_ADMIN_SECRET}\n`,
      { encoding: 'utf8' }
    )

    // * Apply migrations
    const migrateApply = spawnSync('./node_modules/.bin/hasura', ['migrate', 'apply'])
    console.log(migrateApply.stdout.toString())
  }
}

migrate()
