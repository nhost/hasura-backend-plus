import rateLimit, { Message } from 'express-rate-limit'

const { MAX_REQUESTS = 100, TIME_FRAME = 15 * 60 * 1000 } = process.env

interface LimitMessage extends Message {
  statusCode: number
  message: string
  [key: string]: any
}

export const limiter = rateLimit({
  headers: true,

  max: parseInt(<string>MAX_REQUESTS),
  windowMs: parseInt(<string>TIME_FRAME),

  message: <LimitMessage>(<unknown>{
    statusCode: 429,
    error: 'Too Many Requests',
    message: 'You are being rate limited.'
  })
})
