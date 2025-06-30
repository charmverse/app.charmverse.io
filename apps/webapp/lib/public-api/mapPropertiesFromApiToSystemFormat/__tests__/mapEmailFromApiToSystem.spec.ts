import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';

import { mapEmailFromApiToSystem } from '../mapEmailFromApiToSystem';

const schema = generateSchema({ type: 'number' });

describe('mapEmailFromApiToSystem', () => {
  it('should return the provided email value', () => {
    const email = 'test@email.com';
    expect(mapEmailFromApiToSystem({ value: email, schema })).toBe(email);
  });

  it('should return null if value is null', () => {
    expect(mapEmailFromApiToSystem({ value: null, schema })).toBeNull();
  });

  it('should throw an error if value type is not one of the supported types', () => {
    expect(() => mapEmailFromApiToSystem({ value: [], schema })).toThrow(InvalidInputError);
    expect(() => mapEmailFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);
    expect(() => mapEmailFromApiToSystem({ value: 123, schema })).toThrow(InvalidInputError);
  });
});
