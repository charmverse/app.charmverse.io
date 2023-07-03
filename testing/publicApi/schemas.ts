import { v4 as uuid } from 'uuid';

import type { PropertyType } from 'lib/focalboard/board';
import type { PageProperty, PagePropertyOption } from 'lib/public-api/interfaces';

const textSchema: PageProperty = {
  id: uuid(),
  name: 'Text',
  type: 'text'
};

const numberSchema: PageProperty = {
  id: uuid(),
  name: 'Number',
  type: 'number'
};

const emailSchema: PageProperty = {
  id: uuid(),
  name: 'Email',
  type: 'email'
};

const phoneSchema: PageProperty = {
  id: uuid(),
  name: 'Phone',
  type: 'phone'
};

const urlSchema: PageProperty = {
  id: uuid(),
  name: 'URL',
  type: 'url'
};

const checkboxSchema: PageProperty = {
  id: uuid(),
  name: 'Checkbox',
  type: 'checkbox'
};
const dateSchema: PageProperty = {
  id: uuid(),
  name: 'Date',
  type: 'date'
};

const personSchema: PageProperty = {
  id: uuid(),
  name: 'Person',
  type: 'person'
};

const selectSchema: PageProperty = {
  id: uuid(),
  name: 'Select',
  type: 'select',
  options: [
    { id: uuid(), value: 'Option 1', color: 'propColorTeal' },
    { id: uuid(), value: 'Option 2', color: 'propColorYellow' },
    { id: uuid(), value: 'Option 3', color: 'propColorRed' }
  ]
};

const multiSelectSchema: PageProperty = {
  id: uuid(),
  name: 'Multi-select',
  type: 'multiSelect',
  options: [
    { id: uuid(), value: 'Option 1', color: 'propColorTeal' },
    { id: uuid(), value: 'Option 2', color: 'propColorYellow' },
    { id: uuid(), value: 'Option 3', color: 'propColorRed' }
  ]
};

export function generateSchema({
  type,
  options
}: {
  type: PropertyType;
  options?: Pick<PagePropertyOption, 'id' | 'value'>[];
}): PageProperty {
  switch (type) {
    case 'text':
      return { ...textSchema };
    case 'number':
      return { ...numberSchema };
    case 'email':
      return { ...emailSchema };
    case 'phone':
      return { ...phoneSchema };
    case 'url':
      return { ...urlSchema };
    case 'checkbox':
      return { ...checkboxSchema };
    case 'date':
      return { ...dateSchema };
    case 'person':
      return { ...personSchema };
    case 'select':
      return {
        ...selectSchema,
        options: options?.map((opt) => ({ ...opt, color: 'propColorRed' })) || selectSchema.options
      };
    case 'multiSelect':
      return {
        ...multiSelectSchema,
        options: options?.map((opt) => ({ ...opt, color: 'propColorRed' })) || multiSelectSchema.options
      };
    default:
      throw new Error(`Unknown property type: ${type}`);
  }
}
