import { debounce } from 'lodash';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import charmClient from 'charmClient';
import { useAddProjectMember, useGetProjects, usePatchProject } from 'charmClient/hooks/projects';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { AddProjectMemberPayload } from 'lib/projects/addProjectMember';
import type { ProjectWithMembers } from 'lib/projects/interfaces';
import type { UpdateProjectPayload } from 'lib/projects/patchProject';
import type { UpdateProjectMemberPayload } from 'lib/projects/updateProjectMember';

export function useProjectUpdates({ projectId }: { projectId: string }) {
  const { mutate, data: projectsWithMembers } = useGetProjects();
  const { user } = useUser();
  const { trigger: patchProject } = usePatchProject(projectId);
  const project = projectsWithMembers?.find((_project) => _project.id === projectId);
  const isTeamLead = project?.projectMembers[0].userId === user?.id;
  const { trigger: addProjectMember } = useAddProjectMember(projectId);
  const { reset } = useFormContext<ProjectWithMembers>();
  const { showMessage } = useSnackbar();

  const onProjectUpdate = useMemo(
    () =>
      debounce(async (projectPayload: UpdateProjectPayload) => {
        if (!projectId || !isTeamLead) {
          return null;
        }

        try {
          // Optimistically update the project in the cache
          mutate(
            (projects) => {
              if (!projects) {
                return projects;
              }

              return projects.map((_project) => {
                if (_project.id === projectId) {
                  return {
                    ..._project,
                    ...projectPayload,
                    projectMembers: _project.projectMembers
                  };
                }

                return _project;
              });
            },
            {
              revalidate: false
            }
          );

          const updatedProject = await patchProject(projectPayload);
          return updatedProject;
        } catch (_) {
          showMessage('Failed to update project', 'error');
          return null;
        }
      }, 300),
    [projectId, user?.id, isTeamLead]
  );

  const onProjectMemberUpdate = useMemo(
    () =>
      debounce(async (projectMemberPayload: UpdateProjectMemberPayload & { userId?: string }) => {
        if ((isTeamLead || projectMemberPayload.userId === user?.id) && projectMemberPayload.id) {
          try {
            mutate(
              (projects) => {
                if (!projects) {
                  return projects;
                }

                return projects.map((_project) => {
                  if (_project.id === projectId) {
                    const updatedProject = {
                      ..._project,
                      projectMembers: _project.projectMembers.map((_projectMember) => {
                        if (_projectMember.id === projectMemberPayload.id) {
                          return {
                            ..._projectMember,
                            ...projectMemberPayload
                          };
                        }

                        return _projectMember;
                      })
                    };
                    return updatedProject;
                  }

                  return _project;
                });
              },
              {
                revalidate: false
              }
            );

            const updatedProjectMember = await charmClient.projects.updateProjectMember({
              memberId: projectMemberPayload.id,
              payload: projectMemberPayload,
              projectId
            });

            return updatedProjectMember;
          } catch (err) {
            showMessage('Failed to update project member', 'error');
            return null;
          }
        }
      }, 300),
    [projectId, user?.id, isTeamLead]
  );

  const onProjectMemberAdd = async (projectMemberPayload: AddProjectMemberPayload) => {
    if (isTeamLead && project) {
      try {
        const createdProjectMember = await addProjectMember(projectMemberPayload);
        reset({
          ...project,
          projectMembers: [...project.projectMembers, createdProjectMember]
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
                  projectMembers: [..._project.projectMembers, createdProjectMember]
                };
              }

              return _project;
            });
          },
          {
            revalidate: false
          }
        );
        return createdProjectMember;
      } catch (err) {
        showMessage('Failed to add project member', 'error');
        return null;
      }
    }
  };

  return {
    onProjectMemberUpdate,
    onProjectUpdate,
    onProjectMemberAdd
  };
}
