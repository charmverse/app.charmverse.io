import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';

import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGetProjects } from 'charmClient/hooks/projects';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { defaultProjectValues } from 'lib/projects/constants';
import type { ProjectAndMembersFieldConfig, ProjectAndMembersPayload } from 'lib/projects/interfaces';

import { useProjectForm, convertToProjectValues } from './useProjectForm';

export function useProject({
  projectId,
  fieldConfig
}: {
  projectId: MaybeString;
  fieldConfig: ProjectAndMembersFieldConfig;
}) {
  const { mutate, data: projectsWithMembers } = useGetProjects();
  const projectWithMembers = projectsWithMembers?.find((project) => project.id === projectId);
  const { user } = useUser();
  const isTeamLead = projectWithMembers?.projectMembers[0].userId === user?.id;
  const hasProjectWithMembers = !!projectWithMembers;
  const form = useProjectForm({
    projectWithMembers,
    fieldConfig,
    defaultRequired: true
  });

  useEffect(() => {
    if (projectId && projectWithMembers) {
      form.reset(convertToProjectValues(projectWithMembers));
    }
    // Reset form state with default project values if no project is selected
    else if (!projectId) {
      form.reset(defaultProjectValues);
    }
  }, [projectId, hasProjectWithMembers]);

  const { showMessage } = useSnackbar();
  const debouncedUpdate = useMemo(() => {
    return debounce(
      (projectPayload) => projectId && charmClient.projects.updateProject(projectId, projectPayload),
      300
    );
  }, [projectId]);

  const onProjectUpdate = useCallback(
    async (projectPayload: ProjectAndMembersPayload) => {
      try {
        await debouncedUpdate(projectPayload);
        mutate(
          (projects) => {
            if (!projects || !projectWithMembers) {
              return projects;
            }

            return projects.map((_project) => {
              if (_project.id === projectWithMembers.id) {
                return {
                  ..._project,
                  ...projectPayload,
                  projectMembers: projectPayload.projectMembers.map((projectMember, index) => {
                    return {
                      ..._project.projectMembers[index],
                      ...projectMember
                    };
                  })
                };
              }

              return _project;
            });
          },
          {
            revalidate: false
          }
        );
      } catch (_) {
        showMessage('Failed to update project', 'error');
      }
    },
    [debouncedUpdate, mutate, projectWithMembers, showMessage]
  );

  const project = form.getValues();
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  useEffect(() => {
    if (isDirty && isValid && isTeamLead && projectWithMembers) {
      const updatePayload = {
        id: projectWithMembers.id,
        ...project,
        projectMembers: project.projectMembers.map((projectMember, index) => ({
          id: projectWithMembers.projectMembers[index].id,
          ...projectMember
        }))
      };
      onProjectUpdate(updatePayload);
      form.reset(updatePayload, {
        keepDirty: false,
        keepTouched: false
      });
    }
  }, [project, isDirty, isTeamLead, isValid, onProjectUpdate]);

  return {
    form,
    isTeamLead,
    projectWithMembers
  };
}
