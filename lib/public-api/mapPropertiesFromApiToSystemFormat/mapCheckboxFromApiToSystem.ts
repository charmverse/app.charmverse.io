import { InvalidInputError } from '@charmverse/core/errors';

import type { ValueToValidate } from './interfaces';

export function mapCheckboxFromApiToSystem({ value, schema }: ValueToValidate): string {
  if (typeof value === 'boolean') {
    return value.toString();
  } else if (value === 'true' || value === 'false') {
    return value;
  } else {
    throw new InvalidInputError(
      `Invalid value type for "${
        schema.name
      }" field of type checkbox. Expected boolean or stringified boolean, got ${typeof value}`
    );
  }
}
