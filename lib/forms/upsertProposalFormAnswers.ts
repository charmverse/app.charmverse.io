import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { v4 } from 'uuid';

import type { FieldAnswerInput } from 'components/common/form/interfaces';
import { validateAnswers } from 'lib/forms/validateAnswers';
import { isTruthy } from 'lib/utils/types';

export type RubricAnswerUpsert = {
  proposalId: string;
  answers: FieldAnswerInput[];
};

export async function upsertProposalFormAnswers({
  answers,
  proposalId,
  skipRequiredFieldCheck
}: RubricAnswerUpsert & { skipRequiredFieldCheck?: boolean }) {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Valid proposalId is required`);
  }

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: { id: proposalId },
    select: { form: { include: { formFields: true } }, status: true }
  });

  const isDraft = proposal.status === 'draft';

  if (!proposal.form) {
    throw new InvalidInputError(`Proposal ${proposalId} does not have a form`);
  }

  const form = proposal.form;

  const existingAnswers = await prisma.formFieldAnswer.findMany({ where: { proposalId } });

  const answersToSave = answers
    .map((a) => {
      const field = form.formFields.find((f) => f.id === a.fieldId);

      if (!field) {
        throw new InvalidInputError(`Could not find field ${a.fieldId} for proposal ${proposalId}`);
      }

      // do not save answers for labels
      if (field.type === 'label') {
        return null;
      }

      return {
        ...a,
        ...field
      };
    })
    .filter(isTruthy);

  if (!isDraft && !validateAnswers(answersToSave, form.formFields)) {
    throw new InvalidInputError(`All required fields must be answered`);
  }

  const projectProfileValue = answersToSave.find((a) => a.type === 'project_profile')?.value as { projectId: string };

  const res = await prisma.$transaction([
    ...answersToSave.map((a) => {
      const field = form.formFields.find((f) => f.id === a.fieldId);
      const existingAnswer = existingAnswers.find((e) => e.fieldId === a.fieldId);
      const answerId = existingAnswer?.id || v4();
      return prisma.formFieldAnswer.upsert({
        where: { id: answerId },
        create: {
          id: answerId,
          proposalId,
          fieldId: a.fieldId,
          value: a.value,
          type: field?.type || 'short_text'
        },
        update: {
          value: a.value,
          type: field?.type
        }
      });
    }),
    prisma.formFieldAnswer.findMany({ where: { proposalId } }),
    ...(projectProfileValue
      ? projectProfileValue.projectId
        ? [
            prisma.proposal.update({
              where: {
                id: proposalId
              },
              data: {
                projectId: projectProfileValue.projectId
              }
            })
          ]
        : [
            prisma.proposal.update({
              where: {
                id: proposalId
              },
              data: {
                projectId: null
              }
            })
          ]
      : [])
  ]);

  return res[res.length - 1];
}
