import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import type { PropertyType } from 'lib/focalboard/board';
import { InvalidStateError } from 'lib/middleware';
import { DatabasePageNotFoundError } from 'lib/public-api/errors';
import type { BoardPropertyValue, PageProperty } from 'lib/public-api/interfaces';

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
  databaseId: string;
  properties: Record<string, any>;
};

/**
 * Return a map of properties from the API format to the system format
 *
 * These are the properties for a specific card
 */
export async function mapPropertiesFromApiToSystem({
  databaseId,
  properties
}: PropertiesToMap): Promise<Record<string, BoardPropertyValue>> {
  const database = await prisma.block.findFirst({
    where: {
      id: databaseId,
      type: 'board'
    }
  });

  if (!database) {
    throw new DatabasePageNotFoundError(databaseId);
  }

  const schema = (database.fields as any).cardProperties as PageProperty[];

  if (!schema) {
    throw new InvalidStateError(`The database ${databaseId} does not have a schema`);
  }

  const mappedProperties = Object.entries(properties).reduce((acc, [key, value]) => {
    const propertySchema = schema.find((prop) => prop.name === key || prop.id === key);

    if (!propertySchema) {
      throw new InvalidInputError(`Property "${key}" does not exist in the database ${databaseId}`);
    } else if (!fieldMappers[propertySchema.type as UpdateableDatabaseFields]) {
      throw new InvalidInputError(`The property "${key}" cannot be created or updated via the public API`);
    }

    const mappedValue = fieldMappers[propertySchema.type as UpdateableDatabaseFields]({
      schema: propertySchema,
      value
    });

    acc[propertySchema.id] = mappedValue;

    return acc;
  }, {} as Record<string, BoardPropertyValue>);

  return mappedProperties;
}
