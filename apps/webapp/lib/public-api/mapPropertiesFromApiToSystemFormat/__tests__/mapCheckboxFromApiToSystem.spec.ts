import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';

import { mapCheckboxFromApiToSystem } from '../mapCheckboxFromApiToSystem';

const schema = generateSchema({ type: 'checkbox' });

describe('mapCheckboxFromApiToSystem', () => {
  it('should return stringified true if value is true', () => {
    expect(mapCheckboxFromApiToSystem({ value: true, schema })).toBe('true');
  });

  it('should return stringified false if value is false', () => {
    expect(mapCheckboxFromApiToSystem({ value: false, schema })).toBe('false');
  });

  it('should return stringified boolean if value is stringified boolean', () => {
    expect(mapCheckboxFromApiToSystem({ value: 'true', schema })).toBe('true');
    expect(mapCheckboxFromApiToSystem({ value: 'false', schema })).toBe('false');
  });

  it('should throw an error if value type is not one of the supported types', () => {
    expect(() => mapCheckboxFromApiToSystem({ value: 'not a boolean', schema })).toThrow(InvalidInputError);

    expect(() => mapCheckboxFromApiToSystem({ value: [], schema })).toThrow(InvalidInputError);

    expect(() => mapCheckboxFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);

    expect(() => mapCheckboxFromApiToSystem({ value: 123, schema })).toThrow(InvalidInputError);
  });
});
