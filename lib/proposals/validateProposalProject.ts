import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

import type { FieldAnswerInput, FormFieldInput } from 'components/common/form/interfaces';
import { convertToProjectValues, createProjectYupSchema } from 'components/settings/projects/hooks/useProjectForm';
import type { ProjectEditorFieldConfig } from 'lib/projects/interfaces';

export async function validateProposalProject({
  formFields,
  formAnswers
}: {
  formFields?: Pick<FormFieldInput, 'type' | 'id' | 'fieldConfig'>[];
  formAnswers?: Pick<FieldAnswerInput, 'fieldId' | 'value'>[];
}) {
  const projectField = formFields?.find((field) => field.type === 'project_profile');
  const projectId = (formAnswers?.find((answer) => answer.fieldId === projectField?.id)?.value as { projectId: string })
    ?.projectId;
  if (projectField && projectId) {
    const projectSchema = createProjectYupSchema({
      fieldConfig: projectField.fieldConfig as ProjectEditorFieldConfig,
      defaultRequired: true
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
      await projectSchema.validate(convertToProjectValues(project));
    } catch (error) {
      throw new InvalidInputError(`Project profile validation failed`);
    }
  }
}
