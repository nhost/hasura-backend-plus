require('tsconfig-paths/register')
import migrate from '../migrate'
import { applyMigrations } from "../shared/migrations"

export default async (): Promise<void> => {
  await applyMigrations()
  await migrate({ metadata: './db/hasura/metadata', migrations: './test-mocks/migrations' })
}
