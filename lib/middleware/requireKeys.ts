import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';
import { ISystemError } from 'lib/utilities/errors';
import { ApiError } from 'lib/middleware';

/**
 * Generates a request handler that checks for target keys
 */
export function requireKeys<T> (keys: Array<keyof T>, location: 'body' | 'query') {
  return (req: NextApiRequest, res: NextApiResponse<ISystemError>, next: NextHandler) => {

    const toVerify = location === 'query' ? req.query : req.body;

    // NextJS populates empty query or body as {} so this should never fire.
    if (!toVerify) {
      throw new ApiError({
        errorType: 'Invalid input',
        message: `${location} is undefined`
      });
    }

    for (const key of keys) {
      if (!toVerify[key]) {
        throw new ApiError({
          errorType: 'Invalid input',
          message: `Key ${key} is required in request ${location} and must not be an empty value`
        });
      }
    }
    next();

  };
}

export default requireKeys;
