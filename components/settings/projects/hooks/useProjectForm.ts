import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useMemo, useRef } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import { useGetProjects } from 'charmClient/hooks/projects';
import { useMembers } from 'hooks/useMembers';
import { useUser } from 'hooks/useUser';
import { convertToProjectValues } from 'lib/projects/convertToProjectValues';
import { createProjectYupSchema } from 'lib/projects/createProjectYupSchema';
import { getDefaultProjectValues } from 'lib/projects/getDefaultProjectValues';
import type { ProjectAndMembersFieldConfig, ProjectWithMembers } from 'lib/projects/interfaces';

export function useProjectForm(options: {
  fieldConfig: ProjectAndMembersFieldConfig;
  defaultRequired?: boolean;
  projectId?: string | null;
  selectedMemberIds?: string[];
  initialProjectValues?: ProjectWithMembers | null;
}) {
  const { defaultRequired, fieldConfig } = options;
  const { user } = useUser();
  const { membersRecord } = useMembers();
  const { data: projectsWithMembers } = useGetProjects();
  const selectedMemberIds = options.selectedMemberIds;

  const defaultProjectAndMembersPayload = useMemo(
    () => getDefaultProjectValues({ user, membersRecord }),
    [user, membersRecord]
  );

  const yupSchema = useRef(yup.object());

  useEffect(() => {
    yupSchema.current = createProjectYupSchema({
      fieldConfig,
      defaultRequired
    });
  }, [fieldConfig, defaultRequired]);

  const form = useForm({
    defaultValues: defaultProjectAndMembersPayload,
    reValidateMode: 'onChange',
    resolver: yupResolver(yupSchema.current),
    criteriaMode: 'all',
    mode: 'onChange'
  });

  useEffect(() => {
    const projectWithMembers =
      options.initialProjectValues ?? projectsWithMembers?.find((project) => project.id === options.projectId);

    if (!projectWithMembers) {
      return;
    }
    // Make sure only the selected members are present in the form
    form.reset(
      convertToProjectValues({
        ...projectWithMembers,
        projectMembers: projectWithMembers.projectMembers.filter((member, index) =>
          // 0th index is the team lead which is always present
          member.id ? index === 0 || selectedMemberIds?.includes(member.id) : false
        )
      })
    );
  }, [!!projectsWithMembers, !!options.initialProjectValues, options.projectId, selectedMemberIds?.length]);

  return form;
}
