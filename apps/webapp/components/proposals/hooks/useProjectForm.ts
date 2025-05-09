import type { ProjectMember } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import { createDefaultProjectAndMembersPayload } from '@packages/lib/projects/constants';
import { convertToProjectValues } from '@packages/lib/projects/convertToProjectValues';
import { createProjectYupSchema } from '@packages/lib/projects/createProjectYupSchema';
import type { ProjectAndMembersFieldConfig } from '@packages/lib/projects/formField';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';
import { isTruthy } from '@packages/utils/types';
import { useCallback, useEffect, useRef } from 'react';
import type { Resolver } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

export function useProjectForm(options: { fieldConfig?: ProjectAndMembersFieldConfig }) {
  const { fieldConfig } = options;

  const resolver = useYupValidationResolver(createProjectYupSchema({ fieldConfig }));

  const yupSchema = useRef(yup.object());

  useEffect(() => {
    yupSchema.current = createProjectYupSchema({
      fieldConfig
    });
  }, [!!fieldConfig]);

  const form = useForm({
    defaultValues: createDefaultProjectAndMembersPayload(),
    reValidateMode: 'onChange',
    resolver,
    criteriaMode: 'all',
    mode: 'onChange'
  });

  const applyProject = useCallback(
    (project: ProjectWithMembers, selectedMemberIds: string[]) => {
      const teamLead = project.projectMembers.find((member) => member.teamLead)!;
      // make sure that projectMembers is the same order as selectedMemberIds
      const projectMembers = selectedMemberIds
        .map((memberId) => project.projectMembers.find((member) => member.id === memberId))
        // sanity check - dont include team lead twice
        .filter((member) => !member?.teamLead)
        .filter(isTruthy);
      form.reset(
        convertToProjectValues({
          ...project,
          projectMembers: [teamLead, ...projectMembers]
        })
      );
      // trigger form so that errors are populated correctly
      form.trigger();
    },
    [form]
  );

  const applyProjectMembers = useCallback(
    (projectMembers: ProjectMember[]) => {
      form.setValue('projectMembers', projectMembers);
    },
    [form]
  );

  return { form, applyProject, applyProjectMembers };
}

// wrap yupResolver so that it always updates with the schema
function useYupValidationResolver(validationSchema: any) {
  const schema = useRef();
  schema.current = validationSchema;

  return useCallback<Resolver>(async (data, context, options) => {
    return yupResolver(schema.current!)(data, context, options);
  }, []);
}
