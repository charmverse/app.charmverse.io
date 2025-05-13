import { InvalidInputError } from '@charmverse/core/errors';
import type { PropertyType } from '@packages/databases/board';
import type { PageProperty } from 'lib/public-api/interfaces';
import type { UpdateableDatabaseFields } from 'lib/public-api/mapPropertiesFromApiToSystemFormat/index';
import { v4 as uuid } from 'uuid';

const textSchema: PageProperty<'text'> = {
  id: uuid(),
  name: 'Text',
  type: 'text'
};

const numberSchema: PageProperty<'number'> = {
  id: uuid(),
  name: 'Number',
  type: 'number'
};

const emailSchema: PageProperty<'email'> = {
  id: uuid(),
  name: 'Email',
  type: 'email'
};

const phoneSchema: PageProperty<'phone'> = {
  id: uuid(),
  name: 'Phone',
  type: 'phone'
};

const urlSchema: PageProperty<'url'> = {
  id: uuid(),
  name: 'URL',
  type: 'url'
};

const checkboxSchema: PageProperty<'checkbox'> = {
  id: uuid(),
  name: 'Checkbox',
  type: 'checkbox'
};
const dateSchema: PageProperty<'date'> = {
  id: uuid(),
  name: 'Date',
  type: 'date'
};

const personSchema: PageProperty<'person'> = {
  id: uuid(),
  name: 'Person',
  type: 'person'
};

const selectSchema: PageProperty<'select'> = {
  id: uuid(),
  name: 'Select',
  type: 'select',
  options: [
    { id: uuid(), value: 'Option 1', color: 'propColorTeal' },
    { id: uuid(), value: 'Option 2', color: 'propColorYellow' },
    { id: uuid(), value: 'Option 3', color: 'propColorRed' }
  ]
};

const multiSelectSchema: PageProperty<'multiSelect'> = {
  id: uuid(),
  name: 'Multi-select',
  type: 'multiSelect',
  options: [
    { id: uuid(), value: 'Option 1', color: 'propColorTeal' },
    { id: uuid(), value: 'Option 2', color: 'propColorYellow' },
    { id: uuid(), value: 'Option 3', color: 'propColorRed' }
  ]
};

type SchemaGeneratorParams<T extends PropertyType = PropertyType> = {
  type: T;
  options?: T extends 'select' | 'multiSelect' ? string[] : undefined;
  propertyName?: string;
};
export function generateSchema<T extends Extract<PropertyType, 'select' | 'multiSelect'>>(
  input: SchemaGeneratorParams<T>
): PageProperty<T>;
export function generateSchema<T extends Exclude<PropertyType, 'select' | 'multiSelect'>>(
  input: Pick<SchemaGeneratorParams<T>, 'type' | 'propertyName'>
): PageProperty<T>;
export function generateSchema<T extends PropertyType>(input: SchemaGeneratorParams<T>): PageProperty<T>;
export function generateSchema<T extends PropertyType = PropertyType>({
  type,
  options,
  propertyName
}: SchemaGeneratorParams<T>): PageProperty<T> {
  const id = uuid();
  switch (type as T) {
    case 'text':
      return { ...textSchema, type: 'text' as T, id, name: propertyName || textSchema.name } as any as PageProperty<T>;
    case 'number':
      return { ...numberSchema, id, name: propertyName || numberSchema.name } as any as PageProperty<T>;
    case 'email':
      return { ...emailSchema, id, name: propertyName || emailSchema.name } as any as PageProperty<T>;
    case 'phone':
      return { ...phoneSchema, id, name: propertyName || phoneSchema.name } as any as PageProperty<T>;
    case 'url':
      return { ...urlSchema, id, name: propertyName || urlSchema.name } as any as PageProperty<T>;
    case 'checkbox':
      return { ...checkboxSchema, id, name: propertyName || checkboxSchema.name } as any as PageProperty<T>;
    case 'date':
      return { ...dateSchema, id, name: propertyName || dateSchema.name } as any as PageProperty<T>;
    case 'person':
      return { ...personSchema, id, name: propertyName || personSchema.name } as any as PageProperty<T>;
    case 'select':
      return {
        ...selectSchema,
        id,
        name: propertyName || selectSchema.name,
        options: options?.map((opt) => ({ id: uuid(), value: opt, color: 'propColorRed' })) || selectSchema.options
      } as any as PageProperty<T>;
    case 'multiSelect':
      return {
        ...multiSelectSchema,
        id,
        name: propertyName || multiSelectSchema.name,
        options: options?.map((opt) => ({ id: uuid(), value: opt, color: 'propColorRed' })) || multiSelectSchema.options
      } as any as PageProperty<T>;
    default:
      throw new InvalidInputError(`Unsupported property type: ${type}`);
  }
}

type GeneratorParams = Partial<{
  [key in UpdateableDatabaseFields]: SchemaGeneratorParams<key>;
}>;

type GeneratedFullSchema = {
  [key in UpdateableDatabaseFields]: PageProperty<key>;
};

export function generateSchemasForAllSupportedFieldTypes({
  checkbox,
  date,
  email,
  multiSelect,
  number,
  person,
  phone,
  select,
  text,
  url
}: GeneratorParams = {}): GeneratedFullSchema {
  return {
    checkbox: generateSchema({ type: 'checkbox', ...checkbox }),
    date: generateSchema({ type: 'date', ...date }),
    email: generateSchema({ type: 'email', ...email }),
    multiSelect: generateSchema({ type: 'multiSelect', ...multiSelect }),
    number: generateSchema({ type: 'number', ...number }),
    person: generateSchema({ type: 'person', ...person }),
    phone: generateSchema({ type: 'phone', ...phone }),
    select: generateSchema({ type: 'select', ...select }),
    text: generateSchema({ type: 'text', ...text }),
    url: generateSchema({ type: 'url', ...url })
  };
}
