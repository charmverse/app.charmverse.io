import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma } from '@charmverse/core/prisma';
import { convertToProjectValues } from '@packages/lib/projects/convertToProjectValues';
import { createProjectYupSchema } from '@packages/lib/projects/createProjectYupSchema';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';
import type { FormFieldInput, FormFieldValue } from '@packages/lib/proposals/forms/interfaces';

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
    // get team lead
    const teamLead = project.projectMembers.find((member) => member.teamLead);
    if (!teamLead) {
      throw new InvalidInputError(`Team lead not found in project`);
    }
    // team lead is always included
    projectMembers = [teamLead];
    for (const memberId of selectedMemberIds) {
      const member = project.projectMembers.find((m) => m.id === memberId);
      if (!member) {
        throw new InvalidInputError(`Member with id ${memberId} does not exist in project`);
      }
      if (projectMembers.some((m) => m.id === memberId)) {
        projectMembers.push(member);
      }
    }
    project.projectMembers = projectMembers;
  }

  const projectSchema = createProjectYupSchema({
    fieldConfig: projectField.fieldConfig as ProjectAndMembersFieldConfig
  });
  projectSchema.validateSync(convertToProjectValues({ ...project, projectMembers }), { abortEarly: false });
}
