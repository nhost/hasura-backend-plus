import { REGISTRATION } from './config'
import Joi from 'joi'

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

const passwordRule = Joi.string().min(REGISTRATION.MIN_PASSWORD_LENGTH).max(128);
const passwordRuleRequired = passwordRule.required();

const emailRule = extendedJoi.string().email().required().allowedDomains()

const accountFields = {
  email: emailRule,
  password: passwordRuleRequired
}

type AccountFields = {
  email: string
  password?: string
}

const accountFieldsMagicLink = {
  email: emailRule,
  password: passwordRule
}

type AccountFieldsMagicLink = {
  email: string
  password?: string
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

export type UserDataFields = {
  user_data: any,
  register_options?: {
    allowed_roles?: string[],
    default_role?: string
  }
}

export const registerSchema = Joi.object({
  ...accountFields,
  ...userDataFields,
  cookie: Joi.boolean()
})

export type RegisterSchema = AccountFields & UserDataFields & {
  cookie?: boolean
}

export const registerSchemaMagicLink = Joi.object({
  ...accountFieldsMagicLink,
  ...userDataFields,
  cookie: Joi.boolean()
})

export type RegisterSchemaMagicLink = AccountFieldsMagicLink & UserDataFields & {
  cookie?: boolean
}

export const registerUserDataSchema = Joi.object(userDataFields)

export type RegisterUserDataSchema = UserDataFields

const ticketFields = {
  ticket: Joi.string().uuid({ version: 'uuidv4' }).required()
}

type TicketFields = {
  ticket: string
}

const codeFields = {
  code: Joi.string().length(6).required()
}

type CodeFields = {
  code: string
}

export const resetPasswordWithTicketSchema = Joi.object({
  ...ticketFields,
  new_password: passwordRule
})

export type ResetPasswordWithTicketSchema = TicketFields & {
  new_password: string
}

export const changePasswordFromOldSchema = Joi.object({
  old_password: passwordRule,
  new_password: passwordRule
})

export type ChangePasswordFromOldSchema = {
  old_password: string
  new_password: string
}

export const emailResetSchema = Joi.object({
  new_email: emailRule
})

export type EmailResetSchema = {
  new_email: string
}

export const logoutSchema = Joi.object({
  all: Joi.boolean()
})

export type LogoutSchema = {
  all?: boolean
}

export const mfaSchema = Joi.object(codeFields)

export type MfaSchema = CodeFields

export const loginAnonymouslySchema = Joi.object({
  anonymous: Joi.boolean(),
  email: Joi.string(), // these will be checked more rigorously in `loginSchema`
  password: Joi.string() // these will be checked more rigorously in `loginSchema`
})

export type LoginAnonymouslySchema = {
  anonymous?: boolean
  email?: string
  password?: string
}

export const magicLinkLoginAnonymouslySchema = Joi.object({
  anonymous: Joi.boolean(),
  email: Joi.string(), // these will be checked more rigorously in `loginSchema`
})

export type MagicLinkLoginAnonymouslySchema = {
  anonymous?: boolean
  email?: string
}

export const loginSchema = extendedJoi.object({
  email: emailRule,
  password: Joi.string().required(),
  cookie: Joi.boolean()
})

export type LoginSchema = {
  email: string
  password: string
  cookie?: boolean
}

export const loginSchemaMagicLink = extendedJoi.object({
  email: emailRule,
  password: Joi.string(),
  cookie: Joi.boolean()
})

export type LoginSchemaMagicLink = {
  email: string
  password?: string
  cookie?: boolean
}

export const forgotSchema = Joi.object({ email: emailRule })

export type ForgotSchema = {
  email?: string
}

export const verifySchema = Joi.object({ ...ticketFields })

export type VerifySchema = TicketFields

export const totpSchema = Joi.object({
  ...codeFields,
  ...ticketFields,
  cookie: Joi.boolean()
})

export type TotpSchema = CodeFields & TicketFields & {
  cookie?: boolean
}

export const imgTransformParams = Joi.object({
  w: Joi.number().integer().min(0).max(8192),
  h: Joi.number().integer().min(0).max(8192),
  q: Joi.number().integer().min(0).max(100).default(100),
  b: Joi.number().integer().min(0.3).max(1000),
  r: Joi.alternatives().try(Joi.number(), Joi.string().valid('full')),
  token: Joi.string().uuid()
})

export type ImgTransformParams = {
  w?: number
  h?: number
  q?: number
  b?: number
  r?: number|'full'
  token?: string
}

export const fileMetadataUpdate = Joi.object({
  // action: Joi.string().valid('revoke-token','some-other-action').required(),
  action: Joi.string().valid('revoke-token').required()
})

export type FileMetadataUpdate = {
  action: 'revoke-token'
}

export const magicLinkQuery = Joi.object({
  token: Joi.string().required(),
  action: Joi.string().valid('log-in', 'sign-up').required(),
  cookie: Joi.boolean().optional(),
});

export type MagicLinkQuery = {
  token: string
  action: string
  cookie?: boolean
}