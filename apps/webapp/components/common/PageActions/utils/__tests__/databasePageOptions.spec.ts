import crypto from 'crypto';

import type { Member } from '@packages/lib/members/interfaces';

import {
  createBoardPropertyOptions,
  createCardFieldProperties,
  createNewPropertiesForBoard,
  validDate,
  validateAllBlockDates,
  isNumber,
  mapCardBoardProperties,
  selectColors,
  transformCsvResults,
  transformApiPageKeysCsvData
} from '../databasePageOptions';
import {
  mockCardProperties,
  mockCsvResults,
  mockCsvRow,
  mockCsvRowWithMultiSelectAsHeaders,
  mockMappedBoardProperties,
  mockStatusOptions
} from '../mocks';

describe('Database options util', () => {
  // @TODO -> Remove this after upgrading jest >29 and jest-environment-jsdom >29
  // jest-environment-jsdom does not support crypto.getRandomValues() used in uuid lib
  Object.defineProperty(global.self, 'crypto', {
    value: {
      getRandomValues: (arr: any[]) => crypto.randomBytes(arr.length)
    }
  });

  test('isNumber should validate if a string can be transformed into a number', () => {
    expect(isNumber('2012-12-01')).toBeFalsy();
    expect(isNumber('December 10, 2021')).toBeFalsy();
    expect(isNumber('1325376000000')).toBeTruthy();
    expect(isNumber('543543')).toBeTruthy();
    expect(isNumber('random text')).toBeFalsy();
  });

  test('validDate should validate a date and return it', () => {
    expect(validDate('2012-12-01')).toBeTruthy();
    expect(validDate('December 10, 2021')).toBeTruthy();
    expect(validDate('1354320000000')).toBeTruthy();
    expect(validDate('543543')).toBeFalsy();
    expect(validDate('random text')).toBeFalsy();
  });

  test('validateAllBlockDates should validate if a string has one or 2 valid dates', () => {
    expect(validateAllBlockDates('2012-12-01 -> 2012-12-03')).toBeTruthy();
    expect(validateAllBlockDates('December 01 2012 -> December 03 2012')).toBeTruthy();
    expect(validateAllBlockDates('1354320000000 -> 1354485600000')).toBeTruthy();
    expect(validateAllBlockDates('2012-12-01')).toBeTruthy();
    expect(validateAllBlockDates('December 10, 2021')).toBeTruthy();
    expect(validateAllBlockDates('543543')).toBeFalsy();
    expect(validateAllBlockDates('random text')).toBeFalsy();
  });

  test('createBoardPropertiesOptions should receive a list of string from the csv and create a list of options property for a type Board block', () => {
    const createdOptions = createBoardPropertyOptions(mockStatusOptions);

    for (const option of createdOptions) {
      expect(mockStatusOptions.includes(option.value)).toBeTruthy();
      expect(selectColors.includes(option.color)).toBeTruthy();
    }
  });

  test('mapCardBoardProperties should receive all card properties from a board and return a normalized response', () => {
    const expectedObj = {
      Status: {
        id: 'f97c73b6-1d7d-49ed-a3c4-ef27e624185b',
        type: 'select',
        name: 'Status',
        options: {
          Completed: '90b55f20-62e2-4812-b417-1831a44da542',
          'In progress': 'a007d7b1-d055-446a-ba18-90a48121305c',
          'Not started': '30f7e52a-41fd-4f50-a217-1d4f40daa873'
        }
      },
      'Multi Select': {
        id: 'k23m78b6-1d7d-49ed-a3c4-ef27e624470p',
        type: 'multiSelect',
        name: 'Multi Select',
        options: {
          A: '90b55f20-62e2-4812-b417-1831a44da542',
          B: 'a007d7b1-d055-446a-ba18-90a48121305c',
          C: '30f7e52a-41fd-4f50-a217-1d4f40daa873'
        }
      }
    };

    expect(mapCardBoardProperties(mockCardProperties)).toEqual(expectedObj);
  });

  test('createNewPropertiesForBoard should create new card properties for the board depending on the result of the csv', () => {
    const csvData = [mockCsvRow];

    const newBoardPropertiesWithNumber = createNewPropertiesForBoard(csvData, 'Number');
    const newBoardPropertiesWithMultiSelect = createNewPropertiesForBoard(csvData, 'Multi Select');
    const newBoardPropertiesWithDate = createNewPropertiesForBoard(csvData, 'Date');
    const newBoardPropertiesWithUrl = createNewPropertiesForBoard(csvData, 'Url');
    const newBoardPropertiesWithEmail = createNewPropertiesForBoard(csvData, 'Email');
    const newBoardPropertiesWithCheckbox = createNewPropertiesForBoard(csvData, 'Checkbox');

    expect(newBoardPropertiesWithNumber.name === 'Number').toBeTruthy();
    expect(newBoardPropertiesWithNumber.type === 'number').toBeTruthy();
    expect(newBoardPropertiesWithMultiSelect.name === 'Multi Select').toBeTruthy();
    expect(newBoardPropertiesWithMultiSelect.type === 'multiSelect').toBeTruthy();
    expect(newBoardPropertiesWithMultiSelect.options.length === 2).toBeTruthy();
    expect(newBoardPropertiesWithDate.name === 'Date').toBeTruthy();
    expect(newBoardPropertiesWithDate.type === 'date').toBeTruthy();
    expect(newBoardPropertiesWithUrl.name === 'Url').toBeTruthy();
    expect(newBoardPropertiesWithUrl.type === 'url').toBeTruthy();
    expect(newBoardPropertiesWithEmail.name === 'Email').toBeTruthy();
    expect(newBoardPropertiesWithEmail.type === 'email').toBeTruthy();
    expect(newBoardPropertiesWithCheckbox.name === 'Checkbox').toBeTruthy();
    expect(newBoardPropertiesWithCheckbox.type === 'checkbox').toBeTruthy();
  });

  test('createCardFieldProperties should create new card properties for the card', async () => {
    const member = {
      id: '8h5t73b6-1d7d-0j6f-a3c4-ef27e624185b'
    } as unknown as Member;

    const expectedResult = {
      'f97c73b6-1d7d-49ed-a3c4-ef27e624185b': '32132131',
      '93953299-1320-4277-9547-82246f28fa99': [
        '6a2ae45a-8bb4-42ac-9110-82148e15034e',
        '42da3123-f5d5-4790-9ddf-f3835bd73dd2'
      ],
      'e800cd89-8ab4-4630-8794-68f5e0b35c09': '8h5t73b6-1d7d-0j6f-a3c4-ef27e624185b',
      'a6930408-89d0-4f08-a96b-b0ae9db922ed': '{"from":1639692000000}',
      '612afba2-a56a-4009-a36b-16752045b7f6': 'www.charmverse.io',
      '076a0k6g-a56a-0273-a36b-18765045b7f6': 'test@charmversetest.io',
      '7yh79309-a56a-1356-a36b-16752045b0k8': 'true'
    };

    // Needed for any server around the world to return the same value. In CV this is not needed because we need only the date and not the hour
    jest.spyOn(Date.prototype, 'getTime').mockReturnValue(1639692000000);

    const cardProperties = createCardFieldProperties(mockCsvRow, mockMappedBoardProperties, { [member.id]: member });

    expect(cardProperties).toEqual(expectedResult);
  });

  test('transformCsvResults should overwrite the first property and change it to a Title property', async () => {
    const customTitle = 'Form Response';
    const { headers, csvData } = transformCsvResults(mockCsvResults, customTitle);

    expect(headers).toContain('Title');
    expect(csvData.every((row) => row.Title)).toBeTruthy();
    expect(csvData.every((row) => row.Title === customTitle)).toBeTruthy();
  });

  test('transformApiPageKeysCsvData should transform the csv data to the correct format', async () => {
    const csvData = [{ ...mockCsvRowWithMultiSelectAsHeaders }];
    const headers = Object.keys(mockCsvRowWithMultiSelectAsHeaders);
    transformApiPageKeysCsvData(csvData, headers, mockCardProperties);
    expect(headers.every((title) => title !== 'A')).toBeTruthy();
    expect(headers.every((title) => title !== 'B')).toBeTruthy();
    expect(headers.every((title) => title !== 'C')).toBeTruthy();
    expect(csvData[0].A).toBeUndefined();
    expect(csvData[0].B).toBeUndefined();
    expect(csvData[0].C).toBeUndefined();
    expect(csvData[0]['Multi Select'].includes('A')).toBeTruthy();
    expect(csvData[0]['Multi Select'].includes('C')).toBeTruthy();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
