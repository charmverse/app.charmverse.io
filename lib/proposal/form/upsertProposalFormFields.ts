import { InvalidInputError } from '@charmverse/core/errors';
import type { FormField } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { v4 } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { isUUID } from 'lib/utilities/strings';

export async function upsertProposalFormFields({
  proposalId,
  formFields
}: {
  proposalId: string;
  formFields: FormFieldInput[];
}) {
  if (!proposalId) {
    throw new InvalidInputError(`No proposal found with id: ${proposalId}`);
  }

  if (!formFields.length) {
    throw new InvalidInputError(`You need to specify at least one form field`);
  }

  const proposal = await prisma.proposal.findUnique({ where: { id: proposalId }, include: { page: true } });

  if (!proposal) {
    throw new InvalidInputError(`No proposal found with id: ${proposalId}`);
  }

  if (proposal.page?.type !== 'proposal_template') {
    throw new InvalidInputError(`Proposal with id: ${proposalId} is not a template`);
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
      await tx.proposalRubricCriteria.deleteMany({
        where: {
          proposalId,
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
            required: field.type === 'label' ? false : field.required
          },
          update: {
            type: field.type,
            name: field.name,
            description: field.description as any,
            index: field.index,
            options: field.options,
            private: field.private,
            required: field.type === 'label' ? false : field.required
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
