require('tsconfig-paths/register')
import migrate from '../migrate'

export default async (): Promise<void> => {
  console.log()
  await migrate()
  await migrate({ migrations: './test-mocks/migrations' })
}
