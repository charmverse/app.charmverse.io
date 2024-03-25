import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';

import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGetProjects } from 'charmClient/hooks/projects';
import { type ProjectEditorFieldConfig, type ProjectUpdatePayload } from 'components/projects/interfaces';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import { useProjectForm, convertToProjectValues } from './useProjectForm';

export function useProject({
  projectId,
  fieldConfig
}: {
  projectId: MaybeString;
  fieldConfig?: ProjectEditorFieldConfig;
}) {
  const { mutate, data: projectsWithMembers } = useGetProjects();
  const projectWithMembers = projectsWithMembers?.find((project) => project.id === projectId);
  const { user } = useUser();
  const isTeamLead = projectWithMembers?.projectMembers[0].userId === user?.id;

  const form = useProjectForm({
    projectWithMembers,
    fieldConfig,
    defaultRequired: true
  });

  useEffect(() => {
    if (projectId && projectWithMembers) {
      form.reset(convertToProjectValues(projectWithMembers));
      form.trigger();
    }
  }, [projectId]);

  const { showMessage } = useSnackbar();
  const debouncedUpdate = useMemo(() => {
    return debounce(charmClient.updateProject, 300);
  }, []);

  const onProjectUpdate = useCallback(
    async (projectPayload: ProjectUpdatePayload) => {
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
                  projectMembers: _project.projectMembers.map((projectMember, index) => {
                    return {
                      ...projectMember,
                      ...projectPayload.projectMembers[index]
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
    isTeamLead
  };
}
