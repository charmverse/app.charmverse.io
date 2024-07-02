import { InvalidInputError } from '@charmverse/core/errors';
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
  const projectField = formFields?.find((f) => f.type === 'project_profile');
  const projectFieldAnswer = formAnswers?.find((a) => a.fieldId === projectField?.id)?.value as FormFieldValue;
  if (!project) {
    throw new InvalidInputError(`Project does not exist`);
  }

  if (!projectField) {
    throw new InvalidInputError(`Project profile field not found`);
  }

  let projectMembers = project.projectMembers;

  if (typeof projectFieldAnswer === 'object' && 'selectedMemberIds' in projectFieldAnswer) {
    const selectedMemberIds = projectFieldAnswer.selectedMemberIds;
    projectMembers = project.projectMembers.filter((member) => !member.teamLead);
    for (const memberId of selectedMemberIds) {
      const member = projectMembers.find((m) => m.id === memberId);
      if (!member) {
        throw new InvalidInputError(`Member with id ${memberId} does not exist in project`);
      }
      projectMembers.push(member);
    }
    project.projectMembers = projectMembers;
  }

  const projectSchema = createProjectYupSchema({
    fieldConfig: projectField.fieldConfig as ProjectAndMembersFieldConfig,
    defaultRequired: true
  });
  projectSchema.validateSync(convertToProjectValues({ ...project, projectMembers }), { abortEarly: false });
}
