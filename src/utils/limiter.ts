import rateLimit, { Message } from 'express-rate-limit'

const { MAX_REQUESTS = 100, TIME_FRAME = 15 * 60 * 1000 } = process.env

interface LimitMessage extends Message {
  statusCode: number
  message: string
  [key: string]: any
}

export const limiter = rateLimit({
  /**
   * Headers:
   *  X-RateLimit-Limit
   *  X-RateLimit-Remaining
   *  Retry-After
   */
  headers: true,

  /**
   * Maximum amount of requests allowed
   * per time frame (defaults to 100 requests)
   */
  max: parseInt(<string>MAX_REQUESTS),

  /**
   * Time frame in milliseconds (defaults to 15 minutes)
   */
  windowMs: parseInt(<string>TIME_FRAME),

  /**
   * Default error message
   */
  message: <LimitMessage>(<unknown>{
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'You are being rate limited.'
  })
})
