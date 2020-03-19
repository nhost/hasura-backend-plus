import { ALLOWED_EMAIL_DOMAINS } from './config'
import Joi from '@hapi/joi'

interface ExtendedStringSchema extends Joi.StringSchema {
  allowedDomains(): this
}

interface ExtendedJoi extends Joi.Root {
  string(): ExtendedStringSchema
}

const extendedJoi: ExtendedJoi = Joi.extend(joi => ({
  type: 'string',
  base: joi.string(),
  messages: {
    'string.allowedDomains': '{{#label}} is not in an authorised domain'
  },
  rules: {
    allowedDomains: {
      method(): unknown {
        return this.$_addRule({ name: 'allowedDomains' })
      },
      validate(value: string, helpers): unknown {
        if (ALLOWED_EMAIL_DOMAINS) {
          const lowerValue = value.toLowerCase()
          const allowedEmailDomains = ALLOWED_EMAIL_DOMAINS.split(',')

          if (allowedEmailDomains.every(domain => !lowerValue.endsWith(domain.toLowerCase()))) {
            return helpers.error('string.allowedDomains')
          }
        }

        return value
      }
    }
  }
}))

const emailSchema = {
  email: extendedJoi
    .string()
    .email()
    .required()
    .allowedDomains()
}

const userSchema = {
  ...emailSchema,
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
}

export const registerSchema = Joi.object({
  ...userSchema,
  username: Joi.string()
    .alphanum()
    .min(2)
    .max(32)
    .required()
})

const ticketSchema = {
  ticket: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
}

const codeSchema = {
  code: Joi.string()
    .length(6)
    .required()
}

export const passwordResetSchema = Joi.object({
  ...ticketSchema,
  new_password: Joi.string()
    .min(6)
    .max(128)
    .required()
})

export const verifySchema = Joi.object({
  ...ticketSchema,
  new_email: extendedJoi
    .string()
    .email()
    .allowedDomains()
})

export const emailResetSchema = Joi.object({
  ...emailSchema,
  new_email: extendedJoi
    .string()
    .email()
    .required()
    .allowedDomains()
})

export const mfaSchema = Joi.object(codeSchema)
export const loginSchema = extendedJoi.object(userSchema)
export const forgotSchema = Joi.object({ ...emailSchema })
export const totpSchema = Joi.object({ ...codeSchema, ...ticketSchema })
