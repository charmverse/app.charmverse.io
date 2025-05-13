import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import type { FormFieldInput } from '@packages/lib/proposals/forms/interfaces';
import { v4 } from 'uuid';

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
          dependsOnStepIndex: field.dependsOnStepIndex,
          fieldConfig: field.fieldConfig as any
        }
      });
    })
  ]);

  return formId;
}
