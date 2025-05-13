import { debounce } from 'lodash';
import { useCallback, useMemo } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useAddProjectMember, usePatchProject } from 'charmClient/hooks/projects';
import { useUser } from 'hooks/useUser';
import type { AddProjectMemberPayload } from '@packages/lib/projects/addProjectMember';
import type { ProjectWithMembers } from '@packages/lib/projects/interfaces';
import type { UpdateProjectMemberPayload } from '@packages/lib/projects/updateProjectMember';

export function useProjectUpdates({
  projectId,
  refreshProjects,
  isTeamLead
}: {
  projectId?: string; // projectId is only required to make changes
  refreshProjects: KeyedMutator<ProjectWithMembers[]>;
  isTeamLead: boolean;
}) {
  const { user } = useUser();
  const { trigger: updateProject } = usePatchProject(projectId);
  const { trigger: addProjectMember } = useAddProjectMember(projectId);

  // we need to update "project cache" to update the contxt that is used when selecting project or members from the dropdown
  function updateProjectCache(projectPayload: Partial<ProjectWithMembers>) {
    refreshProjects(
      (projects) =>
        projects?.map((_project, i) => {
          if (_project.id === projectId) {
            return {
              ..._project,
              ...projectPayload
            };
          }

          return _project;
        }),
      {
        revalidate: false
      }
    );
  }

  // we need to update "project cache" to update the contxt that is used when selecting project or members from the dropdown
  const updateProjectMemberCache = useCallback(
    (member: ProjectWithMembers['projectMembers'][number], isNew = false) => {
      refreshProjects(
        (projects) =>
          projects?.map((_project) => {
            if (_project.id === projectId) {
              if (isNew) {
                return {
                  ..._project,
                  projectMembers: [..._project.projectMembers, member]
                };
              }
              return {
                ..._project,
                projectMembers: _project.projectMembers.map((projectMember) =>
                  projectMember.id === member.id ? member : projectMember
                )
              };
            }

            return _project;
          }),
        {
          revalidate: false
        }
      );
    },
    [refreshProjects, projectId]
  );

  const onProjectUpdateMemo = useMemo(
    () =>
      debounce(async (projectPayload: Record<string, any>) => {
        if (!isTeamLead || !projectId) {
          return null;
        }

        const updatedProject = await updateProject({
          ...projectPayload,
          id: projectId
        });
        return updatedProject;
      }, 150),
    [projectId, isTeamLead, updateProject]
  );

  // update cache immediately, then debounce the actual update
  function onProjectUpdate(projectPayload: Record<string, any>) {
    updateProjectCache(projectPayload);
    onProjectUpdateMemo(projectPayload);
  }

  const onProjectMemberUpdate = useMemo(
    () =>
      debounce(
        async (
          memberId: string,
          projectMemberPayload: Omit<UpdateProjectMemberPayload, 'id'> & { userId?: string }
        ) => {
          if ((!isTeamLead && projectMemberPayload.userId !== user?.id) || !projectId) {
            return null;
          }
          const updatedTeamMember = await charmClient.projects.updateProjectMember({
            payload: {
              ...projectMemberPayload,
              id: memberId
            },
            projectId
          });
          updateProjectMemberCache(updatedTeamMember);
          return updatedTeamMember;
        },
        150
      ),
    [projectId, user?.id, isTeamLead, updateProjectMemberCache]
  );

  const onProjectMemberAdd = async (projectMemberPayload: AddProjectMemberPayload) => {
    if (!isTeamLead || !projectId) {
      return null;
    }
    const newMember = await addProjectMember(projectMemberPayload);
    updateProjectMemberCache(newMember, true);
    return newMember;
  };

  return {
    onProjectMemberUpdate,
    onProjectUpdate,
    onProjectMemberAdd
  };
}
