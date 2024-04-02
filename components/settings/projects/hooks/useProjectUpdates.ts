import { debounce } from 'lodash';
import { useCallback, useMemo } from 'react';

import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGetProjects } from 'charmClient/hooks/projects';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProjectAndMembersPayload } from 'lib/projects/interfaces';

export function useProjectUpdates({ projectId }: { projectId: MaybeString }) {
  const { mutate, data: projectsWithMembers } = useGetProjects();
  const projectWithMembers = projectsWithMembers?.find((project) => project.id === projectId);

  const { showMessage } = useSnackbar();
  const debouncedUpdate = useMemo(() => {
    return debounce(
      (projectAndMembersPayload) =>
        projectId && charmClient.projects.updateProject(projectId, projectAndMembersPayload),
      300
    );
  }, [projectId]);

  const onProjectUpdate = useCallback(
    async (projectAndMembersPayload: ProjectAndMembersPayload) => {
      try {
        await debouncedUpdate(projectAndMembersPayload);
        mutate(
          (projects) => {
            if (!projects || !projectWithMembers) {
              return projects;
            }

            return projects.map((_project) => {
              if (_project.id === projectWithMembers.id) {
                return {
                  ..._project,
                  ...projectAndMembersPayload,
                  projectMembers: projectAndMembersPayload.projectMembers.map((projectMember, index) => {
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

  return {
    onProjectUpdate
  };
}
