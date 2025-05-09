import type { ParseResult } from 'papaparse';

import type { IPropertyTemplate } from '@packages/databases/board';

import type { MappedProperties } from './databasePageOptions';

export const mockStatusOptions = ['Completed', 'In progress', 'Not started'];

export const mockCardProperties: IPropertyTemplate[] = [
  {
    id: 'f97c73b6-1d7d-49ed-a3c4-ef27e624185b',
    name: 'Status',
    type: 'select',
    options: [
      {
        color: 'propColorTeal',
        id: '90b55f20-62e2-4812-b417-1831a44da542',
        value: 'Completed'
      },
      {
        color: 'propColorYellow',
        id: 'a007d7b1-d055-446a-ba18-90a48121305c',
        value: 'In progress'
      },
      {
        color: 'propColorRed',
        id: '30f7e52a-41fd-4f50-a217-1d4f40daa873',
        value: 'Not started'
      }
    ]
  },
  {
    id: 'k23m78b6-1d7d-49ed-a3c4-ef27e624470p',
    name: 'Multi Select',
    type: 'multiSelect',
    options: [
      {
        color: 'propColorTeal',
        id: '90b55f20-62e2-4812-b417-1831a44da542',
        value: 'A'
      },
      {
        color: 'propColorYellow',
        id: 'a007d7b1-d055-446a-ba18-90a48121305c',
        value: 'B'
      },
      {
        color: 'propColorRed',
        id: '30f7e52a-41fd-4f50-a217-1d4f40daa873',
        value: 'C'
      }
    ]
  }
];

export const mockCsvRow = {
  Name: 'New name',
  Number: '32132131',
  'Multi Select': 'human|dog',
  'Assigned person': '8h5t73b6-1d7d-0j6f-a3c4-ef27e624185b',
  Date: 'December 17 2021',
  Url: 'www.charmverse.io',
  Email: 'test@charmversetest.io',
  Checkbox: 'true'
};

export const mockCsvRowWithMultiSelectAsHeaders = {
  Name: 'New name',
  Number: '32132131',
  'Multi Select': 'human|dog',
  'Assigned person': '8h5t73b6-1d7d-0j6f-a3c4-ef27e624185b',
  Date: 'December 17 2021',
  Url: 'www.charmverse.io',
  Email: 'test@charmversetest.io',
  Checkbox: 'true',
  A: 'A',
  B: '',
  C: 'C'
};

export const mockMappedBoardProperties: { [key: string]: MappedProperties } = {
  Number: {
    id: 'f97c73b6-1d7d-49ed-a3c4-ef27e624185b',
    type: 'number',
    name: 'Number',
    options: {}
  },
  'Multi Select': {
    id: '93953299-1320-4277-9547-82246f28fa99',
    type: 'multiSelect',
    name: 'Multi Select',
    options: {
      human: '6a2ae45a-8bb4-42ac-9110-82148e15034e',
      dog: '42da3123-f5d5-4790-9ddf-f3835bd73dd2'
    }
  },
  'Assigned person': {
    id: 'e800cd89-8ab4-4630-8794-68f5e0b35c09',
    type: 'person',
    name: 'Assigned person',
    options: {}
  },
  Date: {
    id: 'a6930408-89d0-4f08-a96b-b0ae9db922ed',
    type: 'date',
    name: 'Date',
    options: {}
  },
  Url: {
    id: '612afba2-a56a-4009-a36b-16752045b7f6',
    type: 'url',
    name: 'Url',
    options: {}
  },
  Email: {
    id: '076a0k6g-a56a-0273-a36b-18765045b7f6',
    type: 'email',
    name: 'Email',
    options: {}
  },
  Checkbox: {
    id: '7yh79309-a56a-1356-a36b-16752045b0k8',
    type: 'checkbox',
    name: 'Checkbox',
    options: {}
  }
};

export const mockCsvResults: ParseResult<Record<string, string>> = {
  data: [mockCsvRow],
  errors: [],
  meta: {
    delimiter: ',',
    linebreak: '\r\n',
    aborted: false,
    truncated: false,
    cursor: 179,
    fields: Object.keys(mockCsvRow)
  }
};
