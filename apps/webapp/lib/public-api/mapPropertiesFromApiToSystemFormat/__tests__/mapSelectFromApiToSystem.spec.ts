import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { v4 as uuid } from 'uuid';

import { InvalidCustomPropertyValueError } from 'lib/public-api/errors';

import { mapSelectFromApiToSystem } from '../mapSelectFromApiToSystem';

const schema = generateSchema({
  type: 'select',
  options: ['Option 1', 'Option2']
});

describe('mapSelectFromApiToSystem', () => {
  it('should return the same UUID if it exists in schema options', () => {
    expect(mapSelectFromApiToSystem({ value: schema.options?.[0]?.id, schema })).toBe(schema.options[0].id);
  });

  it('should return the corresponding UUID if the value exists in schema options', () => {
    expect(mapSelectFromApiToSystem({ value: schema.options[1].value, schema })).toBe(schema.options[1].id);
  });
  it('should throw an error if value is a UUID, but no option was found with this ID', () => {
    expect(() => mapSelectFromApiToSystem({ value: uuid(), schema })).toThrow(InvalidCustomPropertyValueError);
  });

  it('should throw an error if value is non-uuid, but no option was found with this value', () => {
    expect(() => mapSelectFromApiToSystem({ value: 'Bad value', schema })).toThrow(InvalidCustomPropertyValueError);
  });

  it('should throw an error if value is an array with more than one value', () => {
    expect(() => mapSelectFromApiToSystem({ value: [schema.options[0].id, schema.options[1].id], schema })).toThrow(
      InvalidInputError
    );
  });

  it('should return null if value is null', () => {
    expect(mapSelectFromApiToSystem({ value: null, schema })).toBeNull();
  });

  it('should throw an error if value is not a string or array', () => {
    expect(() => mapSelectFromApiToSystem({ value: true, schema })).toThrow(InvalidInputError);
    expect(() => mapSelectFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);
    expect(() => mapSelectFromApiToSystem({ value: 123, schema })).toThrow(InvalidInputError);
  });
});
