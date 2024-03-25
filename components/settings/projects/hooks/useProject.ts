import { debounce } from 'lodash';
import { useMemo } from 'react';

import { useGetProjects, useUpdateProject } from 'charmClient/hooks/projects';
import type { ProjectUpdatePayload } from 'components/projects/interfaces';
import { useSnackbar } from 'hooks/useSnackbar';

export function useProject({ projectId }: { projectId: string }) {
  const { mutate } = useGetProjects();
  const { trigger: updateProject } = useUpdateProject({ projectId });
  const { showMessage } = useSnackbar();
  const debouncedUpdate = useMemo(() => {
    return debounce(updateProject, 300);
  }, [updateProject]);

  async function onProjectUpdate(projectPayload: ProjectUpdatePayload) {
    try {
      await debouncedUpdate(projectPayload);
      mutate(
        (projects) => {
          if (!projects) {
            return projects;
          }

          return projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                ...projectPayload,
                projectMembers: project.projectMembers.map((projectMember, index) => {
                  return {
                    ...projectMember,
                    ...projectPayload.projectMembers[index]
                  };
                })
              };
            }

            return project;
          });
        },
        {
          revalidate: false
        }
      );
    } catch (_) {
      showMessage('Failed to update project', 'error');
    }
  }

  return {
    onProjectUpdate
  };
}
