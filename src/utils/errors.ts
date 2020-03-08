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

export const errors = async (err: Error, _req: Request, res: Response, _next: NextFunction) => {
  const code = err?.output?.statusCode || 400

  const error = err?.output?.payload || {
    statusCode: code,
    error: code === 400 ? 'Bad Request' : 'Internal Server Error',
    message: err?.details![0]?.message
  }

  res.status(code).send({ ...error })
}
