import { Request, Response } from 'express';

interface Error {
  output?: {
    payload?: Object;
    statusCode?: number;
  };
  details?: [
    {
      message?: string;
    }
  ];
}

/**
 * This is a custom error middleware for Express.
 * https://expressjs.com/en/guide/error-handling.html
 */
export async function errors(err: Error, _req: Request, res: Response) {
  const code = err?.output?.statusCode || 400;

  /**
   * Log errors in development mode.
   */
  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  /**
   * The default error message looks like this.
   */
  const error = err?.output?.payload || {
    statusCode: code,
    error: code === 400 ? 'Bad Request' : 'Internal Server Error',
    message: err?.details![0]?.message
  };

  res.status(code).send({ ...error });
}
