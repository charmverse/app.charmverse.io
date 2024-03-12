import type { NextApiRequest } from 'next';
import type { NextHandler } from 'next-connect';

import { validateTokenGateConditionsObject } from 'lib/tokenGates/validateTokenGateConditionsObject';

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
        await validateTokenGateConditionsObject(body);
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
