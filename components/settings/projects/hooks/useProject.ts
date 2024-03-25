import { debounce } from 'lodash';
import { useCallback, useEffect, useMemo } from 'react';

import { useGetProjects, useUpdateProject } from 'charmClient/hooks/projects';
import type {
  ProjectEditorFieldConfig,
  ProjectUpdatePayload,
  ProjectWithMembers
} from 'components/projects/interfaces';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import { useProjectForm } from './useProjectForm';

export function useProject({
  projectWithMembers,
  defaultRequired,
  fieldConfig
}: {
  projectWithMembers: ProjectWithMembers;
  defaultRequired?: boolean;
  fieldConfig?: ProjectEditorFieldConfig;
}) {
  const { mutate } = useGetProjects();
  const { user } = useUser();
  const isTeamLead = projectWithMembers.projectMembers[0].userId === user?.id;
  const form = useProjectForm({
    projectWithMembers,
    defaultRequired,
    fieldConfig
  });

  const { trigger: updateProject } = useUpdateProject({ projectId: projectWithMembers.id });
  const { showMessage } = useSnackbar();
  const debouncedUpdate = useMemo(() => {
    return debounce(updateProject, 300);
  }, [updateProject]);

  const onProjectUpdate = useCallback(
    async (projectPayload: ProjectUpdatePayload) => {
      try {
        await debouncedUpdate(projectPayload);
        mutate(
          (projects) => {
            if (!projects) {
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
    if (isDirty && isValid && isTeamLead) {
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
