import { HASURA_ENDPOINT, HASURA_GRAPHQL_ADMIN_SECRET, AUTO_MIGRATE } from '@shared/config'
import child_process from 'child_process'
import fetch from 'node-fetch'
import fs from 'fs'
import url from 'url'
const spawn = child_process.spawn

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms))

const waitFor = async (path: string): Promise<void> => {
  try {
    if ((await fetch(path)).status !== 200) {
      await sleep(1000)
      await waitFor(path)
    }
  } catch (error) {
    await sleep(1000)
    await waitFor(path)
  }
}

const gqlEndpoint = url.parse(HASURA_ENDPOINT)
const endpoint = `${gqlEndpoint.protocol}//${gqlEndpoint.host}`

export default async (): Promise<void> => {
  if (AUTO_MIGRATE) {
    // * Wait for GraphQL Engine to be ready
    await waitFor(`${endpoint}/healthz`)
    // * Set the Hasura CLI config.yaml file
    await fs.promises.writeFile(
      'config.yaml',
      `endpoint: ${endpoint}\nadmin_secret: ${HASURA_GRAPHQL_ADMIN_SECRET}\n`,
      { encoding: 'utf8' }
    )

    // * Apply migrations
    const migrateApply = spawn('./node_modules/.bin/hasura', ['migrate', 'apply'])
    migrateApply.stdout.on('data', (data) => process.stdout.write(data.toString()))
    migrateApply.stderr.on('data', (data) => process.stdout.write(data.toString()))
  }
}
