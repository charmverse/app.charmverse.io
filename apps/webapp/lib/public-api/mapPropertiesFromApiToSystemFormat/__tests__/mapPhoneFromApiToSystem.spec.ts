import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';

import { mapPhoneFromApiToSystem } from '../mapPhoneFromApiToSystem';

const schema = generateSchema({ type: 'phone' });

describe('mapPhoneFromApiToSystem', () => {
  it('should return the provided phone value', () => {
    const phone = '1234567890';
    expect(mapPhoneFromApiToSystem({ value: phone, schema })).toBe(phone);
  });

  it('should return null if value is null', () => {
    expect(mapPhoneFromApiToSystem({ value: null, schema })).toBeNull();
  });

  it('should throw an error if value type is not one of the supported types', () => {
    expect(() => mapPhoneFromApiToSystem({ value: [], schema })).toThrow(InvalidInputError);

    expect(() => mapPhoneFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);

    expect(() => mapPhoneFromApiToSystem({ value: 123, schema })).toThrow(InvalidInputError);
  });
});
