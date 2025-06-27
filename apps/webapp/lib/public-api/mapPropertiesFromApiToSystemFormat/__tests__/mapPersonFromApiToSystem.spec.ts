import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { v4 as uuid } from 'uuid';

import { mapPersonFromApiToSystem } from '../mapPersonFromApiToSystem';

const schema = generateSchema({ type: 'person' });

describe('mapPersonFromApiToSystem', () => {
  it('should support a string and return it inside an array', () => {
    const value = uuid();
    expect(mapPersonFromApiToSystem({ value, schema })).toEqual([value]);
  });

  it('should return array of uuids if value is array of uuids', () => {
    const valueList = [uuid(), uuid()];
    expect(mapPersonFromApiToSystem({ value: valueList, schema })).toEqual(valueList);
  });

  it('should return an empty array if value is null', () => {
    expect(mapPersonFromApiToSystem({ value: null, schema })).toEqual([]);
  });

  it('should throw an error if value type is not one of the supported types', () => {
    expect(() => mapPersonFromApiToSystem({ value: 'not a uuid', schema })).toThrow(InvalidInputError);

    expect(() =>
      mapPersonFromApiToSystem({ value: ['not a uuid', '123e4567-e89b-12d3-a456-426614174000'], schema })
    ).toThrow(InvalidInputError);

    expect(() => mapPersonFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);

    expect(() => mapPersonFromApiToSystem({ value: 123, schema })).toThrow(InvalidInputError);
  });
});
