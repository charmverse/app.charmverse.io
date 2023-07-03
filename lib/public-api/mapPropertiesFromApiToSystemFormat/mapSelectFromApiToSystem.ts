import { InvalidInputError } from '@charmverse/core/errors';

import type { ValueToValidate } from './interfaces';

export function mapSelectFromApiToSystem({ value, schema }: ValueToValidate): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    const matchingOption = schema.options?.find((option) => option.id === value || option.value === value);
    if (matchingOption) {
      return matchingOption.id;
    } else {
      throw new InvalidInputError(
        `Value was a UUID, but no option was found with this ID for "${schema.name}" field of type select.`
      );
    }
  }

  if (Array.isArray(value)) {
    if (value.length === 1) {
      const matchingOption = schema.options?.find((option) => option.id === value[0] || option.value === value[0]);
      if (matchingOption) {
        return matchingOption.id;
      } else {
        throw new InvalidInputError(
          `Value was a UUID, but no option was found with this ID for "${schema.name}" field of type select.`
        );
      }
    } else {
      throw new InvalidInputError(
        `Value was an array with more than one value for "${schema.name}" field of type select.`
      );
    }
  }

  throw new InvalidInputError(
    `Invalid value type for "${schema.name}" field of type select. Expected string or array, got ${typeof value}`
  );
}
