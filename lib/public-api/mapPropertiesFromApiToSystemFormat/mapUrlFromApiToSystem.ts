import { InvalidInputError } from '@charmverse/core/errors';

import type { ValueToValidate } from './interfaces';

export function mapUrlFromApiToSystem({ value, schema }: ValueToValidate): string | null {
  if (value === null) {
    return null;
  } else if (typeof value !== 'string') {
    throw new InvalidInputError(
      `Invalid value type for "${schema.name}" field of type url. Expected string, got ${typeof value}`
    );
  }

  return value;
}
