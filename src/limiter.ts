import rateLimit, { Message } from 'express-rate-limit';

const { MAX_REQUESTS = 100, TIME_FRAME = 15 * 60 * 1000 } = process.env;

/**
 * In order to stay consistent with the error message
 * format used in `src/utils/errors.ts`, the `Message`
 * interface from `express-rate-limit` is extended to
 * include the `statusCode` property.
 */
interface LimitMessage extends Message {
  statusCode: number;
  message: string;
  [key: string]: any;
}

export const limiter = rateLimit({
  headers: true,

  max: parseInt(<string>MAX_REQUESTS),
  windowMs: parseInt(<string>TIME_FRAME),

  /**
   * To use the above created interface, an `unknown`
   * conversion for non-overlapping types is necessary.
   */
  message: <LimitMessage>(<unknown>{
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'You are being rate limited.',
  }),
});
