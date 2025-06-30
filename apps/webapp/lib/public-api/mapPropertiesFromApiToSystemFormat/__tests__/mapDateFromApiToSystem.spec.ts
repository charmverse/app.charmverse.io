import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { DateTime } from 'luxon';

import { mapDateFromApiToSystem } from '../mapDateFromApiToSystem';

const schema = generateSchema({ type: 'date' });

describe('mapDateFromApiToSystem', () => {
  it('should return the stringified version of the {from: value} object ', () => {
    const value = DateTime.now().toMillis();
    expect(mapDateFromApiToSystem({ value, schema })).toEqual(JSON.stringify({ from: value }));
  });

  it('should return the stringified version of the {from: value} object if value is a number timestamp', () => {
    const value = DateTime.now().toMillis();
    expect(mapDateFromApiToSystem({ value, schema })).toEqual(JSON.stringify({ from: value }));
  });

  it('should return correct object if value is a string timestamp', () => {
    const value = DateTime.now().toISO();
    expect(mapDateFromApiToSystem({ value, schema })).toEqual(
      JSON.stringify({ from: DateTime.fromISO(value).toMillis() })
    );
  });

  it('should return correct object if value is an RFC 2822 DateTime timestamp', () => {
    const value = 'Tue Jul 11 2023 16:10:37 GMT+0200 (Eastern European Standard Time)';
    const valueAsMillis = DateTime.fromJSDate(new Date(value)).toMillis();
    expect(mapDateFromApiToSystem({ value, schema })).toEqual(JSON.stringify({ from: valueAsMillis }));
  });

  it('should return correct object if value is a stringified number timestamp', () => {
    const value = DateTime.now().toMillis().toString();
    expect(mapDateFromApiToSystem({ value, schema })).toEqual(JSON.stringify({ from: parseInt(value) }));
  });

  it('should return correct object if value is a JSON object with "from" and "to" fields', () => {
    const value = { from: DateTime.now().toMillis(), to: DateTime.now().plus({ days: 1 }).toMillis() };
    expect(mapDateFromApiToSystem({ value, schema })).toEqual(JSON.stringify(value));
  });

  it('should return correct object if value is a JSON object with only a "from" field', () => {
    const value = { from: DateTime.now().toMillis() };
    expect(mapDateFromApiToSystem({ value, schema })).toEqual(JSON.stringify(value));
  });

  it('should throw an error if "to" date is before "from" date', () => {
    const value = { from: DateTime.now().toMillis(), to: DateTime.now().minus({ days: 1 }).toMillis() };
    expect(() => mapDateFromApiToSystem({ value, schema })).toThrow(InvalidInputError);
  });

  it('should throw an error if value type is not one of the supported types', () => {
    expect(() => mapDateFromApiToSystem({ value: 'not a date', schema })).toThrow(InvalidInputError);
    expect(() => mapDateFromApiToSystem({ value: [], schema })).toThrow(InvalidInputError);
    expect(() => mapDateFromApiToSystem({ value: {}, schema })).toThrow(InvalidInputError);
    expect(() => mapDateFromApiToSystem({ value: true, schema })).toThrow(InvalidInputError);
  });

  it('should throw an error if value is JSON but no from field was provided', () => {
    expect(() => mapDateFromApiToSystem({ value: { to: DateTime.now().toMillis() }, schema })).toThrow(
      InvalidInputError
    );
  });
});
