import { ExpectedAnError } from 'testing/errors';

import { InvalidCustomPropertyKeyError, InvalidCustomPropertyValueError, UnsupportedKeysError } from '../errors';
import type { PageProperty } from '../interfaces';
import { mapProperties } from '../mapProperties';

const exampleBoardSchema: PageProperty [ ] = [{
  id: '87b42bed-1dbe-4491-9b6e-fc4c45caa81e',
  name: 'Status',
  type: 'select',
  options: [
    { id: '7154c7b1-9370-4177-8d32-5aec591b158b', color: 'propColorTeal', value: 'Completed' },
    { id: '629f8134-058a-4998-9733-042d9e75f2b0', color: 'propColorYellow', value: 'In progress' },
    { id: '62f3d1a5-68bc-4c4f-ac99-7cd8f6ceb6ea', color: 'propColorRed', value: 'Not started' }
  ]
},
{
  id: '55ba9b7c-0762-40e1-88c5-75de6af2c2fa',
  name: 'Contact method',
  type: 'multiSelect',
  options: [
    { id: '2fe23ec9-3e41-4f6e-84f4-dbd03eac6cb9', color: 'propColorTeal', value: 'Email' },
    { id: '381a72c3-d6e9-4f87-b3b0-edd628a374a8', color: 'propColorYellow', value: 'Phone' },
    { id: '72d50703-5556-4e9d-ad12-a61086451596', color: 'propColorRed', value: 'Whatsapp' }
  ]
},
{
  id: '116731bf-28b5-4237-9361-d154066627e3',
  name: 'Text',
  type: 'text',
  options: []
}
];

describe('mapProperties', () => {
  it('should convert human-readable property names to corresponding system property names', () => {
    const inputData = {
      Status: 'Completed',
      Text: 'Value',
      'Contact method': 'Phone'
    };

    const mapped = mapProperties(inputData, exampleBoardSchema);

    expect(mapped['87b42bed-1dbe-4491-9b6e-fc4c45caa81e']).toBeDefined();
    expect(mapped['55ba9b7c-0762-40e1-88c5-75de6af2c2fa']).toBeDefined();
    expect(mapped['116731bf-28b5-4237-9361-d154066627e3']).toBeDefined();
  });

  it('should convert the value of a human-readable option corresponding system option when field is type select or multiSelect', () => {
    const inputData = {
      Status: 'Completed',
      'Contact method': 'Phone'
    };

    const mapped = mapProperties(inputData, exampleBoardSchema);

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
      mapProperties(inputData, exampleBoardSchema);
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(InvalidCustomPropertyKeyError);
    }
  });

  it('should throw an error when a value for a select or multiSelect field is invalid', () => {
    const inputData = {
      Status: 'Invalid option'
    };

    try {
      mapProperties(inputData, exampleBoardSchema);
      throw new ExpectedAnError();
    }
    catch (error) {
      expect(error).toBeInstanceOf(InvalidCustomPropertyValueError);
    }
  });

});
