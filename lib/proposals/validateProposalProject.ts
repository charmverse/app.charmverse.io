import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma-client';

import type { FormFieldInput, FormFieldValue } from 'components/common/form/interfaces';
import { convertToProjectValues } from 'lib/projects/convertToProjectValues';
import { createProjectYupSchema } from 'lib/projects/createProjectYupSchema';
import { getProjectById } from 'lib/projects/getProjectById';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/interfaces';

export async function validateProposalProject({
  formFields,
  projectId,
  defaultRequired = true,
  formAnswers
}: {
  formAnswers: {
    fieldId: string;
    value: Prisma.JsonValue;
  }[];
  projectId: string;
  formFields?: Pick<FormFieldInput, 'type' | 'fieldConfig' | 'id'>[];
  defaultRequired?: boolean;
}) {
  const projectField = formFields?.find((field) => field.type === 'project_profile');
  const projectFieldAnswer = formAnswers?.find((answer) => answer.fieldId === projectField?.id)
    ?.value as FormFieldValue;

  const project = await getProjectById(projectId);

  if (!project) {
    throw new InvalidInputError(`Project ${projectId} does not exist`);
  }

  if (!projectField) {
    throw new InvalidInputError(`Project profile field not found`);
  }

  const projectSchema = createProjectYupSchema({
    fieldConfig: projectField.fieldConfig as ProjectAndMembersFieldConfig,
    defaultRequired
  });

  if (typeof projectFieldAnswer === 'object' && 'selectedMemberIds' in projectFieldAnswer) {
    const selectedMemberIds = projectFieldAnswer.selectedMemberIds;
    project.projectMembers = [
      project.projectMembers[0],
      ...project.projectMembers.filter((member) => selectedMemberIds.includes(member.id))
    ];
  }

  try {
    await projectSchema.validate(convertToProjectValues(project), { abortEarly: false });
  } catch (error) {
    log.error(`Project profile validation failed`, {
      error,
      projectId
    });
    throw new InvalidInputError(`Project profile validation failed`);
  }
}
