import { ALLOWED_EMAIL_DOMAINS, REGISTRATION_CUSTOM_FIELDS, MIN_PASSWORD_LENGTH } from './config'
import Joi from '@hapi/joi'

interface ExtendedStringSchema extends Joi.StringSchema {
  allowedDomains(): this
}

interface ExtendedJoi extends Joi.Root {
  string(): ExtendedStringSchema
}

const extendedJoi: ExtendedJoi = Joi.extend((joi) => ({
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

          if (allowedEmailDomains.every((domain) => !lowerValue.endsWith(domain.toLowerCase()))) {
            return helpers.error('string.allowedDomains')
          }
        }

        return value
      }
    }
  }
}))

const passwordRule = Joi.string().min(MIN_PASSWORD_LENGTH).max(128).required()

const emailRule = extendedJoi.string().email().required().allowedDomains()

const accountFields = {
  email: emailRule,
  password: passwordRule
}

export const userDataFields = {
  user_data: Joi.object(
    REGISTRATION_CUSTOM_FIELDS.reduce<{ [k: string]: Joi.Schema[] }>(
      (aggr, key) => ({
        ...aggr,
        [key]: [
          Joi.string(),
          Joi.number(),
          Joi.boolean(),
          Joi.object(),
          Joi.array().items(Joi.string(), Joi.number(), Joi.boolean(), Joi.object())
        ]
      }),
      {}
    )
  )
}

export const registerSchema = Joi.object({
  ...accountFields,
  ...userDataFields
})

export const registerUserDataSchema = Joi.object(userDataFields)

const ticketFields = {
  ticket: Joi.string().uuid({ version: 'uuidv4' }).required()
}

const codeFields = {
  code: Joi.string().length(6).required()
}

export const resetPasswordWithTicketSchema = Joi.object({
  ...ticketFields,
  new_password: passwordRule
})

export const changePasswordFromOldSchema = Joi.object({
  old_password: passwordRule,
  new_password: passwordRule
})

export const emailResetSchema = Joi.object({
  new_email: emailRule
})

export const logoutSchema = Joi.object({
  all: Joi.boolean()
})

export const mfaSchema = Joi.object(codeFields)
export const loginAnonymouslySchema = Joi.object({
  anonymous: Joi.boolean(),
  email: Joi.string(), // these will be checked more regeriously in `loginSchema`
  password: Joi.string() // these will be checked more regeriously in `loginSchema`
})
export const loginSchema = extendedJoi.object({
  ...accountFields,
  cookie: Joi.boolean()
})
export const forgotSchema = Joi.object({ email: emailRule })
export const verifySchema = Joi.object({ ...ticketFields })
export const totpSchema = Joi.object({
  ...codeFields,
  ...ticketFields,
  cookie: Joi.boolean()
})
