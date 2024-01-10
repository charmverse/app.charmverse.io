import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';

import { validateTokenGateConditions } from 'lib/tokenGates/validateTokenGateConditions';

import { UnknownError } from './errors';

type ValidationTypes = 'tokenGateConditions';

/**
 * Generates a request handler that checks for specific bodies and validates them with yup
 */
export function requireValidation(type: ValidationTypes) {
  return async (req: NextApiRequest, res: NextApiRequest, next: NextHandler) => {
    const body = req.body;

    switch (type) {
      case 'tokenGateConditions': {
        await validateTokenGateConditions(body);
        break;
      }
      default: {
        throw new UnknownError({
          errorType: 'Invalid input',
          message: `Unknown type ${type} for validation`
        });
      }
    }

    next();
  };
}

export default requireValidation;
