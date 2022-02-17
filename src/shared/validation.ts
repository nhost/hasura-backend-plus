import Joi from '@hapi/joi'

import { REGISTRATION } from './config'

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
        if (REGISTRATION.ALLOWED_EMAIL_DOMAINS) {
          const lowerValue = value.toLowerCase()
          const allowedEmailDomains = REGISTRATION.ALLOWED_EMAIL_DOMAINS.split(',')

          if (allowedEmailDomains.every((domain) => !lowerValue.endsWith(domain.toLowerCase()))) {
            return helpers.error('string.allowedDomains')
          }
        }

        return value
      }
    }
  }
}))

const passwordRule = Joi.string().min(REGISTRATION.MIN_PASSWORD_LENGTH).max(128)
const passwordRuleRequired = passwordRule.required()

const emailRule = extendedJoi.string().email().required().allowedDomains()

const accountFields = {
  email: emailRule,
  password: passwordRuleRequired
}

const accountFieldsMagicLink = {
  email: emailRule,
  password: passwordRule
}

export const userDataFields = {
  user_data: Joi.object(
    REGISTRATION.CUSTOM_FIELDS.reduce<{ [k: string]: Joi.Schema[] }>(
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
  ),
  register_options: Joi.object({
    allowed_roles: Joi.array().items(Joi.string()),
    default_role: Joi.string()
  })
}

export const registerSchema = Joi.object({
  ...accountFields,
  ...userDataFields,
  cookie: Joi.boolean(),
  token: Joi.string()
})

export const getRegisterSchema = () => {
  return registerSchema
}

export const registerSchemaMagicLink = Joi.object({
  ...accountFieldsMagicLink,
  ...userDataFields,
  cookie: Joi.boolean(),
  token: Joi.string()
})

export const getRegisterSchemaMagicLink = () => {
  return registerSchemaMagicLink
}

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

export const smsMfaSchema = Joi.object(codeFields)

// TODO add improved phone number validation
// ex: https://github.com/Salesflare/joi-phone-number
export const smsMFaGenerateSchema = Joi.object({
  phone_number: Joi.string().required()
})

export const loginAnonymouslySchema = Joi.object({
  anonymous: Joi.boolean(),
  email: Joi.string(), // these will be checked more rigorously in `loginSchema`
  password: Joi.string(), // these will be checked more rigorously in `loginSchema`
  token: Joi.string() // hCaptcha code
})

export const magicLinkLoginAnonymouslySchema = Joi.object({
  anonymous: Joi.boolean(),
  email: Joi.string() // these will be checked more rigorously in `loginSchema`
})

export const loginSchema = extendedJoi.object({
  email: emailRule,
  password: Joi.string().required(),
  cookie: Joi.boolean(),
  token: Joi.string() // hCaptcha code
})

export const loginSchemaMagicLink = extendedJoi.object({
  email: emailRule,
  password: Joi.string(),
  cookie: Joi.boolean(),
  token: Joi.string() // hCaptcha code
})

export const forgotSchema = Joi.object({ email: emailRule, token: Joi.string() })

export const verifySchema = Joi.object({ ...ticketFields })

export const totpSchema = Joi.object({
  ...codeFields,
  ...ticketFields,
  cookie: Joi.boolean()
})

export const imgTransformParams = Joi.object({
  w: Joi.number().integer().min(0).max(8192),
  h: Joi.number().integer().min(0).max(8192),
  q: Joi.number().integer().min(0).max(100).default(100),
  b: Joi.number().integer().min(0.3).max(1000),
  r: Joi.alternatives().try(Joi.number(), Joi.string().valid('full')),
  token: Joi.string().uuid()
})

export const fileMetadataUpdate = Joi.object({
  // action: Joi.string().valid('revoke-token','some-other-action').required(),
  action: Joi.string().valid('revoke-token').required()
})

export const magicLinkQuery = Joi.object({
  token: Joi.string().required(),
  action: Joi.string().valid('log-in', 'register').required(),
  cookie: Joi.boolean().optional()
})
