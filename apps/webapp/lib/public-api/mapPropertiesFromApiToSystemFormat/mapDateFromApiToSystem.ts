import { InvalidInputError } from '@packages/core/errors';
import { DateTime } from 'luxon';

import type { ValueToValidate } from './interfaces';

const parseDate = (date: string | number, fieldName: string): number => {
  if (typeof date === 'string') {
    // If the date is a stringified number, parse it as a number
    const parsedNumber = Number(date);
    if (!Number.isNaN(parsedNumber)) {
      return parsedNumber;
    }

    // Try parsing the string as an ISO date
    let parsedDate = DateTime.fromISO(date);
    if (parsedDate.isValid) {
      return parsedDate.toMillis();
    }

    // Try parsing the string as an RFC2822
    parsedDate = DateTime.fromJSDate(new Date(date));
    if (parsedDate.isValid) {
      return parsedDate.toMillis();
    }
  } else if (typeof date === 'number') {
    // If the date is a number, assume it's a timestamp
    return DateTime.fromMillis(date).toMillis();
  }

  throw new InvalidInputError(`Invalid value for "${fieldName}" field of type date. Received value ${date}`);
};
export type DatabaseDate = { from: number; to?: number };

export function mapDateFromApiToSystem({ value, schema }: ValueToValidate): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    return JSON.stringify({ from: parseDate(value, schema.name) } as DatabaseDate);
  }

  if (typeof value === 'object') {
    if ('from' in value) {
      const from = parseDate(value.from as string | number, schema.name);
      const result: DatabaseDate = { from };

      if ('to' in value) {
        const to = parseDate(value.to as string | number, schema.name);
        if (to < from) {
          throw new InvalidInputError(`Invalid date value. "to" value should be after "from" value`);
        }
        result.to = to;
      }

      return JSON.stringify(result);
    }

    throw new InvalidInputError(
      `Invalid value for "${schema.name}" field of type date. Value is JSON but no valid 'from' field was provided`
    );
  }

  throw new InvalidInputError(
    `Invalid value for "${schema.name}" field of type date. Expected number, string, or object, got ${typeof value}`
  );
}
