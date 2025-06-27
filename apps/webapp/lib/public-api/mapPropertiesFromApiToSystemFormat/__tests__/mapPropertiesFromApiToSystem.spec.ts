import type { Page, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { InvalidInputError } from '@packages/core/errors';
import { generateSchema } from '@packages/testing/publicApi/schemas';
import { generateBoard } from '@packages/testing/setupDatabase';
import { v4 as uuid } from 'uuid';

import { DatabasePageNotFoundError, InvalidCustomPropertyKeyError } from 'lib/public-api/errors';

import type { UpdateableDatabaseFields } from '../index';
import { mapPropertiesFromApiToSystem } from '../index';

const textSchema = generateSchema({ type: 'text' });
const numberSchema = generateSchema({ type: 'number' });
const selectSchema = generateSchema({
  type: 'select',
  options: ['Red', 'Green', 'Blue']
});
const multiSelectSchema = generateSchema({
  type: 'multiSelect',
  options: ['Marketing', 'Product', 'Engineering', 'Operations']
});
const dateSchema = generateSchema({ type: 'date' });
const personSchema = generateSchema({ type: 'person' });
const checkboxSchema = generateSchema({ type: 'checkbox' });
const urlSchema = generateSchema({ type: 'url' });
const emailSchema = generateSchema({ type: 'email' });
const phoneSchema = generateSchema({ type: 'phone' });

const schema = [
  textSchema,
  numberSchema,
  selectSchema,
  multiSelectSchema,
  dateSchema,
  personSchema,
  checkboxSchema,
  urlSchema,
  emailSchema,
  phoneSchema
];

const inputValue: Record<UpdateableDatabaseFields, any> = {
  text: 'text',
  number: 1,
  select: [selectSchema.options?.[0]?.id],
  multiSelect: [multiSelectSchema.options?.[0]?.id, multiSelectSchema.options?.[1]?.value],
  date: '2021-01-01',
  person: uuid(),
  checkbox: true,
  url: 'https://www.google.com',
  email: 'test@example.com',
  phone: '123456789'
};

let user: User;
let space: Space;
let database: Page;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
  database = await generateBoard({ createdBy: user.id, spaceId: space.id });

  await prisma.block.update({ where: { id: database.id }, data: { fields: { cardProperties: schema as any } } });
});

describe('mapPropertiesFromApiToSystem', () => {
  it('should map all properties to a record with the property id as the key, allowing the input value to be the property ID or its name', async () => {
    const mapped = await mapPropertiesFromApiToSystem({
      databaseIdOrSchema: database.id,
      // Random mix of key values and names
      properties: {
        [textSchema.id]: inputValue.text,
        [numberSchema.name]: inputValue.number,
        [selectSchema.name]: inputValue.select,
        [multiSelectSchema.id]: inputValue.multiSelect,
        [dateSchema.name]: inputValue.date,
        [personSchema.id]: inputValue.person,
        [checkboxSchema.name]: inputValue.checkbox,
        [urlSchema.id]: inputValue.url,
        [emailSchema.name]: inputValue.email,
        [phoneSchema.id]: inputValue.phone
      }
    });

    // We expect the mapped object to have the property ID as the key
    expect(mapped).toEqual({
      [textSchema.id]: inputValue.text,
      [numberSchema.id]: String(inputValue.number),
      [selectSchema.id]: selectSchema.options?.[0]?.id,
      [multiSelectSchema.id]: [multiSelectSchema.options?.[0]?.id, multiSelectSchema.options?.[1]?.id],
      [dateSchema.id]: expect.stringMatching(/{"from":\d{1,}}/),
      [personSchema.id]: [inputValue.person],
      [checkboxSchema.id]: 'true',
      [urlSchema.id]: inputValue.url,
      [emailSchema.id]: inputValue.email,
      [phoneSchema.id]: inputValue.phone
    });
  });

  it('should skip undefined values during the mapping of properties', async () => {
    const mapped = await mapPropertiesFromApiToSystem({
      databaseIdOrSchema: database.id,
      // Random mix of key values and names
      properties: {
        [textSchema.id]: inputValue.text,
        [numberSchema.name]: inputValue.number,
        [multiSelectSchema.id]: inputValue.multiSelect,
        [personSchema.id]: inputValue.person,
        [urlSchema.id]: inputValue.url,
        [phoneSchema.id]: inputValue.phone,
        [selectSchema.name]: undefined,
        [dateSchema.name]: undefined,
        [checkboxSchema.name]: undefined,
        [emailSchema.name]: undefined
      }
    });

    // We expect the mapped object to have the property ID as the key
    expect(mapped).toEqual({
      [textSchema.id]: inputValue.text,
      [numberSchema.id]: String(inputValue.number),
      [multiSelectSchema.id]: [multiSelectSchema.options[0].id, multiSelectSchema.options[1].id],
      [personSchema.id]: [inputValue.person],
      [urlSchema.id]: inputValue.url,
      [phoneSchema.id]: inputValue.phone
    });

    // This is the number of keys which did not have undefined values
    expect(Object.keys(mapped)).toHaveLength(6);
  });

  it('should throw an error if the database does not exist', async () => {
    await expect(
      mapPropertiesFromApiToSystem({
        databaseIdOrSchema: uuid(),
        properties: {}
      })
    ).rejects.toBeInstanceOf(DatabasePageNotFoundError);
  });

  it('should throw an error if some properties do not exist on the database schema', async () => {
    await expect(
      mapPropertiesFromApiToSystem({
        databaseIdOrSchema: database.id,
        properties: {
          'Inexistent property': 'value'
        }
      })
    ).rejects.toBeInstanceOf(InvalidCustomPropertyKeyError);
  });
});
