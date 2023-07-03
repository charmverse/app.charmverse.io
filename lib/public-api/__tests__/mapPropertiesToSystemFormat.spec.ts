import { v4 } from 'uuid';

import { ExpectedAnError } from 'testing/errors';

import { InvalidCustomPropertyKeyError, InvalidCustomPropertyValueError } from '../errors';
import type { PageProperty } from '../interfaces';
import { mapPropertiesToSystemFormat } from '../mapPropertiesToSystemFormat';

const textSchema: PageProperty = {
  id: v4(),
  name: 'Text',
  type: 'text'
};

const numberSchema: PageProperty = {
  id: v4(),
  name: 'Number',
  type: 'number'
};

const emailSchema: PageProperty = {
  id: v4(),
  name: 'Email',
  type: 'email'
};

const phoneSchema: PageProperty = {
  id: v4(),
  name: 'Phone',
  type: 'phone'
};

const urlSchema: PageProperty = {
  id: v4(),
  name: 'URL',
  type: 'url'
};

const checkboxSchema: PageProperty = {
  id: v4(),
  name: 'Checkbox',
  type: 'checkbox'
};
const dateSchema: PageProperty = {
  id: v4(),
  name: 'Date',
  type: 'date'
};

const personSchema: PageProperty = {
  id: v4(),
  name: 'Person',
  type: 'person'
};

const selectSchema: PageProperty = {
  id: v4(),
  name: 'Select',
  type: 'select',
  options: [
    { id: v4(), value: 'Option 1', color: 'propColorTeal' },
    { id: v4(), value: 'Option 2', color: 'propColorYellow' },
    { id: v4(), value: 'Option 3', color: 'propColorRed' }
  ]
};

const multiSelectSchema: PageProperty = {
  id: v4(),
  name: 'Multi-select',
  type: 'multiSelect',
  options: [
    { id: v4(), value: 'Option 1', color: 'propColorTeal' },
    { id: v4(), value: 'Option 2', color: 'propColorYellow' },
    { id: v4(), value: 'Option 3', color: 'propColorRed' }
  ]
};

const exampleBoardSchema: PageProperty[] = [
  textSchema,
  numberSchema,
  emailSchema,
  phoneSchema,
  urlSchema,
  checkboxSchema,
  dateSchema,
  personSchema,
  selectSchema,
  multiSelectSchema
];

describe('mapPropertiesToSystemFormat', () => {
  it('should convert human-readable property names to corresponding system property names', () => {
    const inputData = {
      Status: 'Completed',
      Text: 'Value',
      'Contact method': 'Phone'
    };

    const mapped = mapPropertiesToSystemFormat(inputData, exampleBoardSchema);

    expect(mapped['87b42bed-1dbe-4491-9b6e-fc4c45caa81e']).toBeDefined();
    expect(mapped['55ba9b7c-0762-40e1-88c5-75de6af2c2fa']).toBeDefined();
    expect(mapped['116731bf-28b5-4237-9361-d154066627e3']).toBeDefined();
  });

  it('should convert the value of a human-readable option corresponding system option when field is type select or multiSelect', () => {
    const inputData = {
      Status: 'Completed',
      'Contact method': 'Phone'
    };

    const mapped = mapPropertiesToSystemFormat(inputData, exampleBoardSchema);

    // Status : Completed
    expect(mapped['87b42bed-1dbe-4491-9b6e-fc4c45caa81e']).toBe('7154c7b1-9370-4177-8d32-5aec591b158b');
    // Contact method : Phone
    expect(mapped['55ba9b7c-0762-40e1-88c5-75de6af2c2fa']).toBe('381a72c3-d6e9-4f87-b3b0-edd628a374a8');
  });

  it('should throw an error when a key does not exist in this board', () => {
    const inputData = {
      WrongKey: 'Some value'
    };

    try {
      mapPropertiesToSystemFormat(inputData, exampleBoardSchema);
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCustomPropertyKeyError);
    }
  });

  it('should throw an error when a value for a select or multiSelect field is invalid', () => {
    const inputData = {
      Status: 'Invalid option'
    };

    try {
      mapPropertiesToSystemFormat(inputData, exampleBoardSchema);
      throw new ExpectedAnError();
    } catch (error) {
      expect(error).toBeInstanceOf(InvalidCustomPropertyValueError);
    }
  });

  // -------- Updated support
  it('should allow a key to be a system property id', () => {});

  // 1. Text
  it('should return a provided text value', () => {});

  // 2. Number
  it('should return a provided number value as string', () => {});

  it('should return a provided number value as string', () => {});

  // 3. Email
  it('should return a provided email value as string', () => {});

  // 4. Phone
  it('should return a provided phone value as string', () => {});

  // 5. URL
  it('should return a provided URL value as string', () => {});

  // 6. Checkbox
  it('should return a provided Checkbox value as string boolean', () => {});

  // 7. Date
  it('should allow a provided Date value to be a string', () => {});

  it('should allow a provided Date value to be a Date with from and optional to properties', () => {});

  // 8. Person
  it('should support a string value', () => {});

  it('should support an array of strings', () => {});

  // 9. Select
  it('should return a provided Select value as optionID', () => {});

  // 10. MultiSelect

  it('should allow a provided Select value to be a string value', () => {});

  it('should allow a provided Select value to be a string optionID', () => {});

  it('should allow a provided Select value to be an array, and return the value as a system optionID', () => {});

  it('should throw an error if provided Select value is an invalid non uuid string', () => {});

  it('should throw an error if provided Select value is an array with more than 1 option', () => {});

  it('should throw an error if the select value does not exist', () => {});

  // Multiselect
  it('should return a provided MultiSelect value as an array of optionIDs', () => {});

  it('should allow a provided MultiSelect value to be a string system optionID', () => {});

  it('should allow a provided MultiSelect value to be a string value', () => {});

  it('should allow a provided MultiSelect value to be an array, and return the value as an array of system optionIDs', () => {});

  it('should throw an error if provided MultiSelect value is an invalid non uuid string', () => {});

  it('should throw an error if the provided MultiSelect value does not exist', () => {});
});
