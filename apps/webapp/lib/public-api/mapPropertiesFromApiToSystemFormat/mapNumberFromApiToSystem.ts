import { InvalidInputError } from '@charmverse/core/errors';

import type { ValueToValidate } from './interfaces';

export function mapNumberFromApiToSystem({ value, schema }: ValueToValidate): string | null {
  if (value === null) {
    return null;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value === 'string' && !Number.isNaN(Number(value))) {
    return value;
  } else {
    throw new InvalidInputError(
      `Invalid value type for "${
        schema.name
      }" field of type number. Expected number or stringified number, got ${typeof value}`
    );
  }
}
