import Joi from '@hapi/joi';

const userSchema = {
  email: Joi.string()
    .email()
    .required(),

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
};

export const loginSchema = Joi.object(userSchema);

export const registerSchema = Joi.object({
  ...userSchema,

  username: Joi.string()
    .alphanum()
    .min(2)
    .max(32)
    .required()
});

const ticketSchema = {
  ticket: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
};

export const forgotSchema = Joi.object({
  ...ticketSchema,

  password: Joi.string()
    .min(6)
    .max(128)
    .required()
});

export const activateSchema = Joi.object(ticketSchema);

const codeSchema = {
  code: Joi.string()
    .length(6)
    .required()
};

export const totpSchema = Joi.object({ ...codeSchema, ...ticketSchema });

export const mfaSchema = Joi.object(codeSchema);
