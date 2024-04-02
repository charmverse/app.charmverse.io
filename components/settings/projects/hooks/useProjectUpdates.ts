import { debounce } from 'lodash';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGetProjects } from 'charmClient/hooks/projects';
import { useSnackbar } from 'hooks/useSnackbar';
import type { ProjectAndMembersPayload } from 'lib/projects/interfaces';

import { convertToProjectValues } from './useProjectForm';

export function useProjectUpdates({ projectId }: { projectId: MaybeString }) {
  const { mutate } = useGetProjects();

  const { reset } = useFormContext<ProjectAndMembersPayload>();

  const { showMessage } = useSnackbar();

  const onProjectUpdate = useMemo(
    () =>
      debounce(async (projectAndMembersPayload: ProjectAndMembersPayload) => {
        if (!projectId) {
          return null;
        }

        try {
          const updatedProjectWithMember = await charmClient.projects.updateProject(
            projectId,
            projectAndMembersPayload
          );

          reset(convertToProjectValues(updatedProjectWithMember));

          mutate(
            (projects) => {
              if (!projects) {
                return projects;
              }

              return projects.map((project) => {
                if (project.id === updatedProjectWithMember.id) {
                  return updatedProjectWithMember;
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
      }, 300),
    [projectId]
  );

  return {
    onProjectUpdate
  };
}
