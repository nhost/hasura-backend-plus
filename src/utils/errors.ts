import { NextFunction, Request, Response } from 'express'

/**
 * Error middleware
 */
export const errorMiddleware = async (
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  /**
   * Set status code
   */
  const code = err?.output?.statusCode || 400

  /**
   * Set error message
   */
  const error = err?.output?.payload || {
    statusCode: code,
    error: code === 400 ? 'Bad Request' : 'Internal Server Error',
    message: err?.details[0]?.message
  }

  /**
   * Send response
   */
  res.status(code).send({ error })
}
