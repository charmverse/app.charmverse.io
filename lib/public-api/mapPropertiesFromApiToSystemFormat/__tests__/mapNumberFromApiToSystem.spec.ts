import { InvalidInputError } from '@charmverse/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';

import { mapNumberFromApiToSystem } from '../mapNumberFromApiToSystem';

const schema = generateSchema({ type: 'number' });

describe('mapNumberFromApiToSystem', () => {
  it('should return the provided number value as a string', () => {
    const num = 123;
    expect(mapNumberFromApiToSystem({ value: num, schema })).toBe('123');
  });

  it('should return null if value is null', () => {
    expect(mapNumberFromApiToSystem({ value: null, schema })).toBeNull();
  });

  it('should return stringified number if value is a stringified number', () => {
    const strNum = '123';
    expect(mapNumberFromApiToSystem({ value: strNum, schema })).toBe(strNum);
  });

  it('should throw an error if value type is not one of the supported types', () => {
    expect(() => mapNumberFromApiToSystem({ value: [], schema })).toThrow(InvalidInputError);
    expect(() => mapNumberFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);
    expect(() => mapNumberFromApiToSystem({ value: 'abc', schema })).toThrow(InvalidInputError);
  });
});
