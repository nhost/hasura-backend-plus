require('tsconfig-paths/register')
import { applyMigrations } from '../shared/migrations'
import { applyMetadata } from '../shared/metadata'

export default async (): Promise<void> => {
  await applyMigrations()
  await applyMetadata()
}
