import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { Prisma } from '@charmverse/core/prisma';

import type { FormFieldInput, FormFieldValue } from 'lib/forms/interfaces';
import { convertToProjectValues } from 'lib/projects/convertToProjectValues';
import { createProjectYupSchema } from 'lib/projects/createProjectYupSchema';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/formField';
import type { ProjectWithMembers } from 'lib/projects/interfaces';

export function validateProposalProject({
  formFields,
  project,
  formAnswers
}: {
  formAnswers: {
    fieldId: string;
    value: Prisma.JsonValue;
  }[];
  project: ProjectWithMembers;
  formFields?: Pick<FormFieldInput, 'type' | 'fieldConfig' | 'id'>[];
}) {
  const projectField = formFields?.find((field) => field.type === 'project_profile');
  const projectFieldAnswer = formAnswers?.find((answer) => answer.fieldId === projectField?.id)
    ?.value as FormFieldValue;

  if (!project) {
    throw new InvalidInputError(`Project does not exist`);
  }

  if (!projectField) {
    throw new InvalidInputError(`Project profile field not found`);
  }

  const projectSchema = createProjectYupSchema({
    fieldConfig: projectField.fieldConfig as ProjectAndMembersFieldConfig,
    defaultRequired: true
  });

  if (typeof projectFieldAnswer === 'object' && 'selectedMemberIds' in projectFieldAnswer) {
    const selectedMemberIds = projectFieldAnswer.selectedMemberIds;
    project.projectMembers = [
      project.projectMembers[0],
      ...project.projectMembers.filter((member) => selectedMemberIds.includes(member.id))
    ];
  }

  try {
    projectSchema.validateSync(convertToProjectValues(project), { abortEarly: false });
  } catch (error) {
    log.error(`Project profile validation failed`, {
      error,
      projectId: project.id
    });
    throw new InvalidInputError(`Project profile validation failed`);
  }
}
