import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';

import { mapUrlFromApiToSystem } from '../mapUrlFromApiToSystem';

const schema = generateSchema({ type: 'url' });

describe('mapUrlFromApiToSystem', () => {
  it('should return the provided url value', () => {
    const url = 'https://example.com';
    expect(mapUrlFromApiToSystem({ value: url, schema })).toBe(url);
  });

  it('should return null if value is null', () => {
    expect(mapUrlFromApiToSystem({ value: null, schema })).toBeNull();
  });

  it('should throw an error if value type is not one of the supported types', () => {
    expect(() => mapUrlFromApiToSystem({ value: [], schema })).toThrow(InvalidInputError);

    expect(() => mapUrlFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);

    expect(() => mapUrlFromApiToSystem({ value: 123, schema })).toThrow(InvalidInputError);
  });
});
