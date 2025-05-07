import { stringUtils } from '@charmverse/core/utilities';
import { ApiError } from '@packages/nextjs/errors';
import type { ISystemError } from '@packages/utils/errors';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { NextHandler } from 'next-connect';
import { isAddress } from 'viem';

type TypeofReturnType = 'string' | 'number' | 'bigint' | 'boolean' | 'symbol' | 'undefined' | 'object' | 'function';
type CustomValueType = 'uuid' | 'truthy' | 'wallet';

const customValueTypeValidators: Record<CustomValueType, (value: any) => boolean> = {
  uuid: (value: any) => !!value && stringUtils.isUUID(value),
  truthy: (value: any) => !!value,
  wallet: (value: any) => !!value && isAddress(value)
};

type RequiredKey<T> = keyof T | { key: keyof T; valueType?: TypeofReturnType | CustomValueType };

/**
 * Generates a request handler that checks for target keys
 * @nullableKeys Keys which are considered to pass required check if they have a null value. Defaults to empty list
 */
export function requireKeys<T = any>(keys: RequiredKey<T>[], location?: 'body' | 'query') {
  return (req: NextApiRequest, res: NextApiResponse<ISystemError>, next: NextHandler) => {
    const toVerify = location === 'query' ? req.query : location === 'body' ? req.body : { ...req.query, ...req.body };

    // NextJS populates empty query or body as {} so this should never fire.
    if (!toVerify) {
      throw new ApiError({
        errorType: 'Invalid input',
        message: `${location} is undefined`
      });
    }

    for (const key of keys) {
      const keyName = typeof key === 'object' ? key.key : key;
      const valueToCheck = toVerify[keyName];
      const expectedValueType = typeof key === 'object' ? key.valueType : undefined;

      if (!((keyName as string) in toVerify)) {
        throw new ApiError({
          errorType: 'Invalid input',
          message: `Key ${keyName as string} is required in request ${location} and must not be an empty value.`
        });
      } else if (expectedValueType) {
        const isCustomValueType = !!customValueTypeValidators[expectedValueType as CustomValueType];
        if (
          (isCustomValueType &&
            customValueTypeValidators[expectedValueType as CustomValueType](valueToCheck) === false) ||
          (!isCustomValueType && (typeof valueToCheck as string) !== expectedValueType)
        )
          throw new ApiError({
            errorType: 'Invalid input',
            message: `Key ${
              keyName as string
            } is required in request ${location} and must be of type: ${expectedValueType}`
          });
      }
    }

    next();
  };
}

export default requireKeys;
