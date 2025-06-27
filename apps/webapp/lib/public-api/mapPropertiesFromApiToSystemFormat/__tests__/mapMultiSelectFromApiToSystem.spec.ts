import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { v4 as uuid } from 'uuid';

import { InvalidCustomPropertyValueError } from 'lib/public-api/errors';

import { mapMultiSelectFromApiToSystem } from '../mapMultiSelectFromApiToSystem';

const schema = generateSchema({
  type: 'multiSelect',
  options: ['Green', 'Blue', 'Red']
});

describe('mapMultiSelectFromApiToSystem', () => {
  it('should return the same UUID in an array if it exists in schema options', () => {
    expect(mapMultiSelectFromApiToSystem({ value: schema.options[0].id, schema })).toEqual([schema.options[0].id]);
  });

  it('should throw an error if value is a UUID, but no option was found with this ID', () => {
    expect(() => mapMultiSelectFromApiToSystem({ value: uuid(), schema })).toThrow(InvalidCustomPropertyValueError);
  });

  it('should throw an error if value is a non-uuid, but no option was found with this value', () => {
    expect(() => mapMultiSelectFromApiToSystem({ value: 'Bad value', schema })).toThrow(
      InvalidCustomPropertyValueError
    );
  });

  it('should return an array of UUIDs if the values exist in schema options', () => {
    // Allow mixed uuids and values
    expect(mapMultiSelectFromApiToSystem({ value: [schema.options[0].id, schema.options[0].value], schema })).toEqual([
      schema.options[0].id,
      schema.options[0].id
    ]);
  });

  it('should return an empty array if the value is null', () => {
    expect(mapMultiSelectFromApiToSystem({ value: null, schema })).toEqual([]);
  });

  it('should throw an error if value is not a string or array', () => {
    expect(() => mapMultiSelectFromApiToSystem({ value: true, schema })).toThrow(InvalidInputError);
    expect(() => mapMultiSelectFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);
    expect(() => mapMultiSelectFromApiToSystem({ value: 123, schema })).toThrow(InvalidInputError);
  });
});
