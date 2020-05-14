import { S3_ACCESS_KEY_ID, S3_ENDPOINT, S3_SECRET_ACCESS_KEY } from './config'

import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  accessKeyId: S3_ACCESS_KEY_ID,
  secretAccessKey: S3_SECRET_ACCESS_KEY,
  endpoint: S3_ENDPOINT,
  s3ForcePathStyle: true,
  signatureVersion: 'v4'
})

export { s3 }
