import jwt, { Algorithm } from 'jsonwebtoken'

const {
  HASURA_GRAPHQL_JWT_SECRET_KEY,
  JWT_ALGORITHM = 'HS256',
  JWT_EXPIRES_AT = '15m'
} = process.env

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
    HASURA_GRAPHQL_JWT_SECRET_KEY as string,
    {
      algorithm: JWT_ALGORITHM as Algorithm,
      expiresIn: JWT_EXPIRES_AT
    }
  )
}

/**
 * Returns true if the application is running in development mode
 */
const isDeveloper = process.env.NODE_ENV === 'development'

/**
 * REFRESH_EXPIRES_AT has a default value of 43200 minutes (30 days)
 */
const REFRESH_EXPIRES_AT = parseInt(<string>process.env.REFRESH_EXPIRES_AT, 10) || 43200

/**
 * Export helper constants
 */
export { isDeveloper, REFRESH_EXPIRES_AT }
