require('tsconfig-paths/register')
import migrate from '../migrate'

export default async (): Promise<void> => {
  await migrate()
  await migrate({ migrations: './test-mocks/migrations' })
}
