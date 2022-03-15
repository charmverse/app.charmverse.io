import { NextApiRequest, NextApiResponse } from 'next';
import { IApiError } from 'lib/utilities/errors';

/**
 * Generates a request handler that checks for target keys
 */
export function requireKeys<T> (keys: Array<keyof T>, location: 'body' | 'query') {
  return (req: NextApiRequest, res: NextApiResponse<IApiError>, next: Function) => {

    const toVerify = location === 'query' ? req.query : req.body;

    // NextJS populates empty query or body as {} so this should never fire.
    if (!toVerify) {
      return res.status(400).send({ message: `${location} is undefined` });
    }

    for (const key of keys) {
      if (!toVerify[key]) {
        return res.status(400).send({ message: `Key ${key} is required in request ${location}` });
      }
    }
    next();

  };
}

export default requireKeys;
