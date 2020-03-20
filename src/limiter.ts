import rateLimit, { Message } from 'express-rate-limit'
import { MAX_REQUESTS, TIME_FRAME } from '@shared/config'

/**
 * In order to stay consistent with the error message
 * format used in `src/utils/errors.ts`, the `Message`
 * interface from `express-rate-limit` is extended to
 * include the `statusCode` property.
 */
interface LimitMessage extends Message {
  statusCode: number
  message: string
  [key: string]: unknown
}

export const limiter = rateLimit({
  headers: true,

  max: parseInt(MAX_REQUESTS as string),
  windowMs: parseInt(TIME_FRAME as string),

  /**
   * To use the above created interface, an `unknown`
   * conversion for non-overlapping types is necessary.
   */
  message: ({
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'You are being rate limited.'
  } as unknown) as LimitMessage
})
