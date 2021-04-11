import { STORAGE } from './config'

import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  accessKeyId: STORAGE.S3_ACCESS_KEY_ID,
  secretAccessKey: STORAGE.S3_SECRET_ACCESS_KEY,
  endpoint: STORAGE.S3_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  sslEnabled: STORAGE.S3_SSL_ENABLED
})

export { s3 }
