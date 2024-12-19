import { InvalidInputError } from '@charmverse/core/errors';
import type { FormField, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { FormFieldInput } from '@root/lib/proposals/forms/interfaces';
import { isUUID } from '@root/lib/utils/strings';
import { v4 } from 'uuid';

import { checkFormFieldErrors } from 'components/common/form/checkFormFieldErrors';

export async function upsertProposalFormFields({
  proposalId,
  formFields
}: {
  proposalId: string;
  formFields: FormFieldInput[];
}) {
  if (!formFields.length) {
    throw new InvalidInputError(`You need to specify at least one form field`);
  }

  const proposal = await prisma.proposal.findUniqueOrThrow({ where: { id: proposalId }, include: { page: true } });

  if (proposal.page?.type !== 'proposal_template') {
    throw new InvalidInputError(`Proposal with id: ${proposalId} is not a template`);
  }

  const formErrors = checkFormFieldErrors(formFields);
  if (proposal.status === 'published' && formErrors) {
    throw new InvalidInputError(formErrors);
  }

  const { formId } = proposal;

  if (!formId) {
    throw new InvalidInputError(`No form found for proposal with id: ${proposalId}`);
  }

  const existingFields = await prisma.formField.findMany({
    where: {
      formId
    },
    select: {
      id: true
    }
  });

  const updatedFormFields = await prisma.$transaction(async (tx) => {
    // Delete fields that do not exist anymore in payload
    if (existingFields.length > 0) {
      await tx.formField.deleteMany({
        where: {
          formId,
          id: {
            in: existingFields.filter((f) => !formFields.some((uf) => uf.id === f.id)).map((c) => c.id)
          }
        }
      });
    }

    // Update fields
    await Promise.all(
      formFields.map((field) => {
        const fieldId = field.id && isUUID(field.id) ? field.id : v4();
        const required = field.type === 'label' ? false : field.required;

        return tx.formField.upsert({
          where: {
            id: fieldId
          },
          create: {
            id: fieldId,
            formId,
            type: field.type,
            name: field.name,
            description: field.description as any,
            index: field.index,
            options: field.options,
            private: field.private,
            required,
            fieldConfig: field.fieldConfig as Prisma.InputJsonValue,
            dependsOnStepIndex: field.dependsOnStepIndex
          },
          update: {
            type: field.type,
            name: field.name,
            description: field.description as any,
            index: field.index,
            options: field.options,
            private: field.private,
            required,
            fieldConfig: field.fieldConfig as Prisma.InputJsonValue,
            dependsOnStepIndex: field.dependsOnStepIndex
          }
        });
      })
    );

    return tx.formField.findMany({
      where: {
        formId
      },
      orderBy: {
        index: 'asc'
      }
    });
  });

  return updatedFormFields as FormField[];
}
