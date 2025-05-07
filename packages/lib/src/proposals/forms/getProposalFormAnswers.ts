import { prisma } from '@charmverse/core/prisma-client';
import { getProposalFormFields } from '@packages/lib/proposals/forms/getProposalFormFields';
import type { FieldAnswerInput, FormFieldInput } from '@packages/lib/proposals/forms/interfaces';

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

  const allAnswers = proposal.formAnswers as FieldAnswerInput[];
  if (!allAnswers) {
    return [];
  }

  const accessibleFields = getProposalFormFields({
    fields: proposal.form?.formFields as unknown as FormFieldInput[],
    canViewPrivateFields
  });
  const accessibleFieldIds = accessibleFields?.map((field) => field.id);

  return allAnswers.filter((answer) => !!accessibleFieldIds?.includes(answer.fieldId));
}
