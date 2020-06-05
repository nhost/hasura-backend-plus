import { S3_ACCESS_KEY_ID, S3_ENDPOINT, S3_SECRET_ACCESS_KEY, S3_SSL_ENABLED } from './config'

import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  accessKeyId: S3_ACCESS_KEY_ID,
  secretAccessKey: S3_SECRET_ACCESS_KEY,
  endpoint: S3_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: 'v4',
  sslEnabled: S3_SSL_ENABLED
})

export { s3 }
