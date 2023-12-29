import { prisma } from '@charmverse/core/prisma-client';

import { canAccessPrivateFields } from 'lib/proposal/form/canAccessPrivateFields';
import { getProposalFormFields } from 'lib/proposal/form/getProposalFormFields';

export async function getProposalFormAnswers({ proposalId, userId }: { userId?: string; proposalId: string }) {
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

  const canViewPrivateFields = await canAccessPrivateFields({ proposalId: proposal.id, userId, proposal });
  const accessibleFields = getProposalFormFields(proposal.form?.formFields, canViewPrivateFields);
  const accessibleFieldIds = accessibleFields?.map((field) => field.id);

  return allAnswers.filter((answer) => !!accessibleFieldIds?.includes(answer.fieldId));
}
