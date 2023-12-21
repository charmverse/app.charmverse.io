import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { v4 } from 'uuid';

import type { FieldAnswerInput } from 'components/common/form/interfaces';
import { isTruthy } from 'lib/utilities/types';

export type RubricAnswerUpsert = {
  formId: string;
  proposalId: string;
  answers: FieldAnswerInput[];
};

export async function upsertProposalFormAnswers({ answers, formId, proposalId }: RubricAnswerUpsert) {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError(`Valid proposalId is required`);
  } else if (!stringUtils.isUUID(formId)) {
    throw new InvalidInputError(`Valid formId is required`);
  }

  const form = await prisma.form.findUniqueOrThrow({ where: { id: formId }, include: { formFields: true } });

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

      if (field.required && !a.value) {
        throw new InvalidInputError(`Value for field ${field.name} is required`);
      }

      return a;
    })
    .filter(isTruthy);

  const hasAllRequiredAnswers = form.formFields.every(
    (f) => !f.required || answersToSave.some((a) => a.fieldId === f.id && !!a.value)
  );

  if (!hasAllRequiredAnswers) {
    throw new InvalidInputError(`All required fields must be answered`);
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
