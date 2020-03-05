import Joi from '@hapi/joi'

/**
 * Base user schema
 */
const userSchema = {
  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
}

/**
 * Login schema
 */
export const loginSchema = Joi.object(userSchema)

/**
 * Register schema
 */
export const registerSchema = Joi.object({
  ...userSchema,

  username: Joi.string()
    .alphanum()
    .min(2)
    .max(32)
    .required()
})

/**
 * Refresh schema
 */
export const refreshSchema = Joi.object({
  refresh_token: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
})

const secretSchema = {
  secret_token: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
}

/**
 * Forgot schema
 */
export const forgotSchema = Joi.object({
  ...secretSchema,

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
})

/**
 * Activate schema
 */
export const activateSchema = Joi.object(secretSchema)
