import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { convertToProjectValues, createProjectYupSchema } from 'components/settings/projects/hooks/useProjectForm';
import type { ProjectAndMembersFieldConfig } from 'lib/projects/interfaces';

export async function validateProposalProject({
  formFields,
  projectId,
  defaultRequired = true
}: {
  projectId: string;
  formFields?: Pick<FormFieldInput, 'type' | 'fieldConfig'>[];
  defaultRequired?: boolean;
}) {
  const projectField = formFields?.find((field) => field.type === 'project_profile');
  if (projectField) {
    const projectSchema = createProjectYupSchema({
      fieldConfig: projectField.fieldConfig as ProjectAndMembersFieldConfig,
      defaultRequired
    });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        projectMembers: true
      }
    });

    if (!project) {
      throw new InvalidInputError(`Project ${projectId} does not exist`);
    }

    try {
      await projectSchema.validate(convertToProjectValues(project), { abortEarly: false });
    } catch (error) {
      throw new InvalidInputError(`Project profile validation failed`);
    }
  }
}
