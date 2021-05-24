import { SMS_MFA } from './config'

import AWS from 'aws-sdk'

const sendSms = async (number: string, otp: string) => {
  const { SNS_REGION: region, SNS_API_VERSION: apiVersion } = SMS_MFA

  const publishParams = {
    Message: `Your valdation code is: ${otp}`,
    PhoneNumber: number
  }

  if (!region) {
    throw new Error('Please set the SNS_REGION env variable to send SMS messages.')
  }

  AWS.config.update({ region })

  try {
    await new AWS.SNS({ apiVersion }).publish(publishParams).promise()
    return
  } catch (error) {
    throw new Error(`Failed to send SMS.`)
  }
}

export { sendSms }
