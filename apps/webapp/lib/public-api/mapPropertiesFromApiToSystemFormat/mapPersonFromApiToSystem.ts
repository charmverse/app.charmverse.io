import { InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

import type { ValueToValidate } from './interfaces';

export function mapPersonFromApiToSystem({ value, schema }: ValueToValidate): string[] {
  if (value === null) {
    return [];
  } else if (typeof value === 'string' && stringUtils.isUUID(value)) {
    return [value];
  } else if (Array.isArray(value) && value.every(stringUtils.isUUID)) {
    return value;
  } else {
    throw new InvalidInputError(
      `Invalid value type for "${
        schema.name
      }" field of type person. Expected uuid or array of uuids, got ${typeof value}`
    );
  }
}
