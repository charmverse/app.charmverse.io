import { debounce } from 'lodash';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';
import { useGetProjects } from 'charmClient/hooks/projects';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { ProjectAndMembersPayload } from 'lib/projects/interfaces';

import { convertToProjectValues } from './useProjectForm';

export function useProjectUpdates({ projectId }: { projectId: MaybeString }) {
  const { mutate, data: projectsWithMembers } = useGetProjects();
  const { user } = useUser();
  const project = projectsWithMembers?.find((_project) => _project.id === projectId);
  const isTeamLead = !!project?.projectMembers.find((pm) => pm.teamLead && pm.userId === user?.id);

  const { reset } = useFormContext<ProjectAndMembersPayload>();

  const { showMessage } = useSnackbar();

  const onProjectUpdate = useMemo(
    () =>
      debounce(async (projectAndMembersPayload: ProjectAndMembersPayload) => {
        if (!projectId) {
          return null;
        }

        try {
          if (isTeamLead) {
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

                return projects.map((_project) => {
                  if (_project.id === updatedProjectWithMember.id) {
                    return updatedProjectWithMember;
                  }

                  return _project;
                });
              },
              {
                revalidate: false
              }
            );
          } else {
            const updatedProjectMemberPayload = projectAndMembersPayload.projectMembers.find(
              (projectMember) => projectMember.userId === user?.id
            );
            if (updatedProjectMemberPayload && updatedProjectMemberPayload.id && updatedProjectMemberPayload.userId) {
              const updatedProjectMember = await charmClient.projects.updateProjectMember({
                memberId: updatedProjectMemberPayload.id,
                payload: updatedProjectMemberPayload,
                projectId
              });

              mutate(
                (projects) => {
                  if (!projects) {
                    return projects;
                  }

                  return projects.map((_project) => {
                    if (_project.id === projectId) {
                      return {
                        ..._project,
                        projectMembers: _project.projectMembers.map((_projectMember) => {
                          if (_projectMember.id === updatedProjectMember.id) {
                            return updatedProjectMember;
                          }

                          return _projectMember;
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
            }
          }
        } catch (_) {
          showMessage('Failed to update project', 'error');
        }
      }, 300),
    [projectId, user?.id, isTeamLead]
  );

  return {
    onProjectUpdate
  };
}
