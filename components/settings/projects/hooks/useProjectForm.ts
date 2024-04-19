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

    if (options.projectId && projectWithMembers) {
      const teamLead = projectWithMembers.projectMembers.find((member) => member.teamLead);
      const nonTeamLeadMembers = projectWithMembers.projectMembers
        .filter(
          (member) =>
            // Make sure only the selected members are present in the form
            !member.teamLead && selectedMemberIds?.includes(member.id)
        )
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

      form.reset(
        convertToProjectValues({
          ...projectWithMembers,
          projectMembers: [teamLead!, ...nonTeamLeadMembers]
        })
      );
      // trigger form so that errors are populated correctly
      form.trigger();
    } else {
      form.reset(defaultProjectAndMembersPayload);
    }
  }, [!!projectsWithMembers, !!options.initialProjectValues, options.projectId, selectedMemberIds?.length]);

  return form;
}
