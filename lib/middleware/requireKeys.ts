import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { ApiError } from 'lib/middleware';
import type { ISystemError } from 'lib/utilities/errors';

type RequiredKey = string | { key: string; truthy: boolean };

/**
 * Generates a request handler that checks for target keys
 * @nullableKeys Keys which are considered to pass required check if they have a null value. Defaults to empty list
 */
export function requireKeys<T>(keys: (RequiredKey | keyof T)[], location: 'body' | 'query') {
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
      const keyName = typeof key === 'object' ? key.key : key;
      const invalidTruthyKey = typeof key === 'object' && key.truthy && !toVerify[keyName];

      if (!((keyName as string) in toVerify) || invalidTruthyKey) {
        throw new ApiError({
          errorType: 'Invalid input',
          message: `Key ${keyName as string} is required in request ${location} and must not be an empty value.`
        });
      }
    }

    next();
  };
}

export default requireKeys;
