import { InvalidInputError } from '@charmverse/core/errors';
import type { PropertyType } from '@root/lib/databases/board';
import { InvalidStateError } from '@root/lib/middleware';
import type { BoardPropertyValue, PageProperty } from '@root/lib/public-api/interfaces';

import { InvalidCustomPropertyKeyError } from '../errors';
import { getDatabaseWithSchema } from '../getDatabaseWithSchema';

import type { MapperFunctionFromApiToSystem } from './interfaces';
import { mapCheckboxFromApiToSystem } from './mapCheckboxFromApiToSystem';
import { mapDateFromApiToSystem } from './mapDateFromApiToSystem';
import { mapEmailFromApiToSystem } from './mapEmailFromApiToSystem';
import { mapMultiSelectFromApiToSystem } from './mapMultiSelectFromApiToSystem';
import { mapNumberFromApiToSystem } from './mapNumberFromApiToSystem';
import { mapPersonFromApiToSystem } from './mapPersonFromApiToSystem';
import { mapPhoneFromApiToSystem } from './mapPhoneFromApiToSystem';
import { mapSelectFromApiToSystem } from './mapSelectFromApiToSystem';
import { mapTextFromApiToSystem } from './mapTextFromApiToSystem';
import { mapUrlFromApiToSystem } from './mapUrlFromApiToSystem';

export type UpdateableDatabaseFields = Extract<
  PropertyType,
  'text' | 'number' | 'select' | 'multiSelect' | 'date' | 'person' | 'checkbox' | 'url' | 'email' | 'phone'
>;

export const fieldMappers: Record<UpdateableDatabaseFields, MapperFunctionFromApiToSystem> = {
  text: mapTextFromApiToSystem,
  number: mapNumberFromApiToSystem,
  select: mapSelectFromApiToSystem,
  checkbox: mapCheckboxFromApiToSystem,
  multiSelect: mapMultiSelectFromApiToSystem,
  date: mapDateFromApiToSystem,
  person: mapPersonFromApiToSystem,
  url: mapUrlFromApiToSystem,
  email: mapEmailFromApiToSystem,
  phone: mapPhoneFromApiToSystem
};

type PropertiesToMap = {
  databaseIdOrSchema: string | PageProperty[];
  properties: Record<string, any>;
  spaceId?: string;
};

type MappedProperties = Record<string, BoardPropertyValue>;
/**
 * Return a map of properties from the API format to the system format
 *
 * These are the properties for a specific card
 */
export async function mapPropertiesFromApiToSystem(input: {
  databaseIdOrSchema: string;
  spaceId?: string;
  properties: Record<string, any>;
}): Promise<MappedProperties>;
export async function mapPropertiesFromApiToSystem(input: {
  databaseIdOrSchema: PageProperty[];
  properties: Record<string, any>;
}): Promise<MappedProperties>;
export async function mapPropertiesFromApiToSystem({
  databaseIdOrSchema,
  properties,
  spaceId
}: PropertiesToMap): Promise<MappedProperties> {
  if (!databaseIdOrSchema) {
    throw new InvalidInputError(`The databaseIdOrSchema is required`);
  }

  const schema =
    typeof databaseIdOrSchema === 'string'
      ? (await getDatabaseWithSchema({ databaseId: databaseIdOrSchema, spaceId }))?.schema
      : databaseIdOrSchema;

  if (!schema) {
    throw new InvalidStateError(`No schema found for the databaseIdOrSchema provided`);
  }

  const mappedProperties = Object.entries(properties).reduce(
    (acc, [key, value]) => {
      if (value === undefined) {
        return acc;
      }

      const propertySchema = schema.find((prop) => prop.name === key || prop.id === key);

      if (!propertySchema) {
        throw new InvalidCustomPropertyKeyError({
          boardSchema: schema,
          key
        });
      } else if (!fieldMappers[propertySchema.type as UpdateableDatabaseFields]) {
        throw new InvalidInputError(`The property "${key}" cannot be created or updated via the public API`);
      }

      const mappedValue = fieldMappers[propertySchema.type as UpdateableDatabaseFields]({
        schema: propertySchema,
        value
      });

      acc[propertySchema.id] = mappedValue;

      return acc;
    },
    {} as Record<string, BoardPropertyValue>
  );

  return mappedProperties;
}
