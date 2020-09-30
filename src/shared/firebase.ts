import admin from 'firebase-admin'

export default function (): void {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    '/custom/keys/serviceAccount.json')

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  })
}
