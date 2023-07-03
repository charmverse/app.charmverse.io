import { InvalidInputError } from '@charmverse/core/errors';

import type { ValueToValidate } from './interfaces';

export function mapMultiSelectFromApiToSystem({ value, schema }: ValueToValidate): string[] {
  if (value === null) {
    return [];
  }

  if (typeof value === 'string') {
    const matchingOption = schema.options?.find((option) => option.id === value || option.value === value);
    if (matchingOption) {
      return [matchingOption.id];
    } else {
      throw new InvalidInputError(
        `Value was a UUID, but no option was found with this ID for "${schema.name}" field of type multiSelect.`
      );
    }
  }

  if (Array.isArray(value)) {
    const output = value.map((val: string) => {
      const matchingOption = schema.options?.find((option) => option.id === val || option.value === val);
      if (matchingOption) {
        return matchingOption.id;
      } else {
        throw new InvalidInputError(
          `Value was a UUID, but no option was found with this ID for "${schema.name}" field of type multiSelect.`
        );
      }
    });
    return output;
  }

  throw new InvalidInputError(
    `Invalid value type for "${schema.name}" field of type multiSelect. Expected string or array, got ${typeof value}`
  );
}
