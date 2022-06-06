import { NextApiRequest, NextApiResponse } from 'next';
import { NextHandler } from 'next-connect';
import { ISystemError } from 'lib/utilities/errors';
import { ApiError } from 'lib/middleware';

/**
 * Generates a request handler that checks for target keys
 * @nullableKeys Keys which are considered to pass required check if they have a null value. Defaults to empty list
 */
export function requireKeys<T> (keys: Array<keyof T>, location: 'body' | 'query', nullableKeys: Array<keyof T> = []) {
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

      // Null value is allowed for this key, we can proceed to check the next key
      if (nullableKeys.indexOf(key) > -1 && toVerify[key] === null) {
        // eslint-disable-next-line no-continue
        continue;
      }

      if (!(key in toVerify)) {
        throw new ApiError({
          errorType: 'Invalid input',
          message: `Key ${key as string} is required in request ${location} and must not be an empty value`
        });
      }
    }
    next();

  };
}

export default requireKeys;
