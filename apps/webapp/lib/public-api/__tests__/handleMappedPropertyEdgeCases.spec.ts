import { generateSchema } from '@packages/testing/publicApi/schemas';

import { handleMappedPropertyEdgeCases } from '../handleMappedPropertyEdgeCases';

describe('mappedPropertyEdgeCases', () => {
  it('should filter out checkbox values when the value is false to remain compliant with focalboard', () => {
    const checkboxSchema = generateSchema({ type: 'checkbox' });
    const secondCheckboxSchema = generateSchema({ type: 'checkbox' });

    const input = {
      [checkboxSchema.id]: 'false',
      [secondCheckboxSchema.id]: 'true'
    };

    const mapped = handleMappedPropertyEdgeCases({
      mapped: input,
      schema: [checkboxSchema, secondCheckboxSchema]
    });

    expect(mapped).toMatchObject({
      [secondCheckboxSchema.id]: 'true'
    });

    expect(Object.keys(mapped)).toHaveLength(1);
  });

  it('should leave other properties unaffected', async () => {
    const textSchema = generateSchema({ type: 'text' });
    const numberSchema = generateSchema({ type: 'number' });
    const selectSchema = generateSchema({ type: 'select' });
    const checkboxSchema = generateSchema({ type: 'checkbox' });

    const input = {
      [textSchema.id]: 'Example text',
      [numberSchema.id]: '5',
      [selectSchema.id]: selectSchema.options[0].id
    };

    const mapped = handleMappedPropertyEdgeCases({
      mapped: { ...input, [checkboxSchema.id]: 'false' },
      schema: [textSchema, numberSchema, selectSchema, checkboxSchema]
    });

    expect(mapped).toMatchObject(input);

    expect(Object.keys(mapped)).toHaveLength(3);
  });
});
