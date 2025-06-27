import { InvalidInputError } from '@packages/core/errors';

import type { ValueToValidate } from './interfaces';

export function mapTextFromApiToSystem({ value, schema }: ValueToValidate): string | null {
  if (value === null) {
    return null;
  } else if (typeof value === 'number') {
    return value.toString();
  } else if (typeof value !== 'string') {
    throw new InvalidInputError(
      `Invalid value type for "${schema.name}" field of type text. Expected string, got ${typeof value}`
    );
  }

  return value;
}
