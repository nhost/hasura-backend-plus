import { NextFunction, Request, Response } from 'express'

interface Error {
  output?: {
    payload?: Object
    statusCode?: number
  }
  details?: [
    {
      message?: string
    }
  ]
}

/**
 * This is a custom error middleware for Express.
 * https://expressjs.com/en/guide/error-handling.html

 * Whenever `next()` is called through the `asyncWrapper`
 * function (`src/utils/helper.ts`), this function will
 * create an error object that's sent to the client.
 */
export const errors = async (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const code = err?.output?.statusCode || 400

  /**
   * The default error message looks like this.
   */
  const error = err?.output?.payload || {
    statusCode: code,
    error: code === 400 ? 'Bad Request' : 'Internal Server Error',
    message: err?.details![0]?.message
  }

  res.status(code).send({ ...error })
}
