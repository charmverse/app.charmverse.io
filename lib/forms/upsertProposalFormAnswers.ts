import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import { v4 } from 'uuid';

import type { FieldAnswerInput } from 'components/common/form/interfaces';
import { createProjectYupSchema } from 'components/settings/projects/hooks/useProjectForm';
import { validateAnswers } from 'lib/forms/validateAnswers';
import type { ProjectFieldConfig } from 'lib/projects/interfaces';
import { isTruthy } from 'lib/utils/types';

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
  const projectFormField = form.formFields.find((f) => f.type === 'project_profile');
  let isValidProjectValues = true;
  if (projectProfileValue.projectId && projectFormField) {
    const projectWithMembers = await prisma.project.findUnique({
      where: { id: projectProfileValue.projectId },
      include: {
        projectMembers: true
      }
    });
    const yupSchema = createProjectYupSchema({
      fieldConfig: projectFormField.fieldConfig as ProjectFieldConfig,
      defaultRequired: true
    });
    try {
      yupSchema.validateSync(projectWithMembers, { abortEarly: true });
    } catch (_) {
      isValidProjectValues = false;
    }
  }

  if (!isValidProjectValues) {
    throw new InvalidInputError(`Invalid project profile values`);
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
