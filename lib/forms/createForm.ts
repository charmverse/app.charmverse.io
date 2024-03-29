import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';

export async function createForm(fields: FormFieldInput[]) {
  if (!fields || fields.length === 0) {
    throw new InvalidInputError('Cannot create form with no fields');
  }

  const formId = v4();

  await prisma.$transaction([
    // create form
    prisma.form.create({ data: { id: formId } }),
    // create form fields
    ...fields.map((field) => {
      const fieldId = field.id || v4();

      return prisma.formField.create({
        data: {
          id: fieldId,
          formId,
          type: field.type,
          name: field.name,
          description: field.description as any,
          index: field.index,
          options: field.options,
          private: field.private,
          required: field.required,
          fieldConfig: field.fieldConfig as any
        }
      });
    })
  ]);

  return formId;
}
