import { InvalidInputError } from '@charmverse/core/errors';
import { v4 as uuid } from 'uuid';

import type { PagePropertyOption } from 'lib/public-api/interfaces';
import { generateSchema } from 'testing/publicApi/schemas';

import { mapMultiSelectFromApiToSystem } from '../mapMultiSelectFromApiToSystem';

const option1: PagePropertyOption = {
  color: 'propColorTeal',
  id: uuid(),
  value: 'Option 1'
};
const option2: PagePropertyOption = {
  color: 'propColorTeal',
  id: uuid(),
  value: 'Option 2'
};

const schema = generateSchema({
  type: 'multiSelect',
  options: [option1, option2]
});

describe('mapMultiSelectFromApiToSystem', () => {
  it('should return the same UUID in an array if it exists in schema options', () => {
    expect(mapMultiSelectFromApiToSystem({ value: option1.id, schema })).toEqual([option1.id]);
  });

  it('should throw an error if value is a UUID, but no option was found with this ID', () => {
    expect(() => mapMultiSelectFromApiToSystem({ value: uuid(), schema })).toThrow(InvalidInputError);
  });

  it('should return an array of UUIDs if the values exist in schema options', () => {
    expect(mapMultiSelectFromApiToSystem({ value: [option1.id, option2.value], schema })).toEqual([
      option1.id,
      option2.id
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
