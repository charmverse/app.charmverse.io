import { prisma } from '@charmverse/core/prisma-client';

import { getProposalFormFields } from 'lib/proposal/form/getProposalFormFields';

export async function getProposalFormAnswers({
  proposalId,
  canViewPrivateFields
}: {
  proposalId: string;
  canViewPrivateFields: boolean;
}) {
  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    include: {
      form: {
        include: {
          formFields: {
            orderBy: {
              index: 'asc'
            }
          }
        }
      },
      formAnswers: true,
      authors: true
    }
  });

  const allAnswers = proposal.formAnswers;
  if (!allAnswers) {
    return [];
  }

  const accessibleFields = getProposalFormFields(proposal.form?.formFields, canViewPrivateFields);
  const accessibleFieldIds = accessibleFields?.map((field) => field.id);

  return allAnswers.filter((answer) => !!accessibleFieldIds?.includes(answer.fieldId));
}
