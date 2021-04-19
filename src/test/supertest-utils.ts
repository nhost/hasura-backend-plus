import { Response } from 'superagent'

export function end(done: any) {
  return (err: Response) => {
    if (err) return done(err);
    else return done();
  }
}
