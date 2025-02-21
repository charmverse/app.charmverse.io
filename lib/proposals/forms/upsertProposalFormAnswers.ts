import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { isTruthy } from '@packages/lib/utils/types';
import type { FieldAnswerInput } from '@root/lib/proposals/forms/interfaces';
import { validateAnswers } from '@root/lib/proposals/forms/validateAnswers';
import { v4 } from 'uuid';

export type RubricAnswerUpsert = {
  proposalId: string;
  answers: FieldAnswerInput[];
};

export async function upsertProposalFormAnswers({ answers, proposalId }: RubricAnswerUpsert) {
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
      if (field.type === 'label' || field.type === 'milestone') {
        return null;
      }

      return {
        ...a,
        ...field
      };
    })
    .filter(isTruthy);

  if (!isDraft) {
    const answerFieldIds = answers.map((a) => a.fieldId);
    // only pass in the form fields being answered
    const formFields = form.formFields.filter((field) => answerFieldIds.includes(field.id));
    if (!validateAnswers(answersToSave, formFields)) {
      throw new InvalidInputError(`All required fields must be answered`);
    }
  }

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
    prisma.formFieldAnswer.findMany({ where: { proposalId } })
  ]);

  return res[res.length - 1];
}
