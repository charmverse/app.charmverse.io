import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';

import { mapTextFromApiToSystem } from '../mapTextFromApiToSystem';

const schema = generateSchema({ type: 'text' });

describe('mapTextFromApiToSystem', () => {
  it('should return the provided text value', () => {
    const text = 'test';
    expect(mapTextFromApiToSystem({ value: text, schema })).toBe(text);
  });

  it('should return null if value is null', () => {
    expect(mapTextFromApiToSystem({ value: null, schema })).toBeNull();
  });

  it('should return text if value is a number', () => {
    expect(mapTextFromApiToSystem({ value: 123, schema })).toBe('123');
  });

  it('should throw an error if value type is not one of the supported types', () => {
    expect(() => mapTextFromApiToSystem({ value: [], schema })).toThrow(InvalidInputError);

    expect(() => mapTextFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);
  });
});
