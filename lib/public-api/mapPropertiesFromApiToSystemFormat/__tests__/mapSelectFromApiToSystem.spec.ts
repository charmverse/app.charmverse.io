import { InvalidInputError } from '@charmverse/core/errors';
import { v4 as uuid } from 'uuid';

import type { PagePropertyOption } from 'lib/public-api/interfaces';
import { generateSchema } from 'testing/publicApi/schemas';

import { mapSelectFromApiToSystem } from '../mapSelectFromApiToSystem';

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
  type: 'select',
  options: [option1, option2]
});

describe('mapSelectFromApiToSystem', () => {
  it('should return the same UUID if it exists in schema options', () => {
    expect(mapSelectFromApiToSystem({ value: option1.id, schema })).toBe(option1.id);
  });

  it('should throw an error if value is a UUID, but no option was found with this ID', () => {
    expect(() => mapSelectFromApiToSystem({ value: uuid(), schema })).toThrow(InvalidInputError);
  });

  it('should return the corresponding UUID if the value exists in schema options', () => {
    expect(mapSelectFromApiToSystem({ value: option1.value, schema })).toBe(option1.id);
  });

  it('should throw an error if value is an array with more than one value', () => {
    expect(() => mapSelectFromApiToSystem({ value: [option1.id, option2.id], schema })).toThrow(InvalidInputError);
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
