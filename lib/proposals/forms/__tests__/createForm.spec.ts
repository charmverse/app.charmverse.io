import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import { createForm } from '../createForm';
import type { FormFieldInput } from '../interfaces';

describe('createForm', () => {
  it('should create form from fields and return valid id of the form', async () => {
    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: false,
        required: true,
        fieldConfig: {},
        dependsOnStepIndex: null
      },
      {
        id: v4(),
        type: 'long_text',
        name: 'long name',
        description: 'another description',
        index: 1,
        options: [],
        private: true,
        required: true,
        fieldConfig: {},
        dependsOnStepIndex: null
      }
    ];

    const formId = await createForm(fieldsInput);

    expect(formId).toBeDefined();

    const formWithFields = await prisma.form.findUnique({
      where: { id: formId },
      include: { formFields: true }
    });

    expect(formWithFields).toBeDefined();
    expect(formWithFields?.formFields).toHaveLength(fieldsInput.length);
  });

  it('should throw an error if there are no fields for the form', async () => {
    await expect(createForm([])).rejects.toBeInstanceOf(InvalidInputError);
  });
});
