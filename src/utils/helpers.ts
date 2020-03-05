import jwt, { Algorithm } from 'jsonwebtoken'

const { JWT_SECRET_KEY, JWT_SECRET_TYPE = 'HS256', JWT_TOKEN_EXPIRES = '15m' } = process.env

/**
 * Generates a JWT token with Hasura claims
 * @param user A user object
 */
export const generateJwtToken = ({ id }: any) => {
  return jwt.sign(
    {
      'https://hasura.io/jwt/claims': {
        'x-hasura-default-role': 'user',
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-user-id': id.toString()
      }
    },
    JWT_SECRET_KEY as string,
    {
      algorithm: JWT_SECRET_TYPE as Algorithm,
      expiresIn: JWT_TOKEN_EXPIRES
    }
  )
}

/**
 * Returns true if the application is running in development mode
 */
export const isDeveloper = process.env.NODE_ENV === 'development'

/**
 * REFRESH_TOKEN_EXP has a default value of 43200 minutes (30 days)
 */
export const REFRESH_TOKEN_EXP = parseInt(process.env.REFRESH_TOKEN_EXP as string, 10) || 43200
