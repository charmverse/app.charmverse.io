import { debounce } from 'lodash';
import { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';

import charmClient from 'charmClient';
import { useAddProjectMember, useGetProjects, usePatchProject } from 'charmClient/hooks/projects';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import type { AddProjectMemberPayload } from 'lib/projects/addProjectMember';
import type { ProjectWithMembers, ProjectAndMembersPayload } from 'lib/projects/interfaces';
import type { UpdateProjectPayload } from 'lib/projects/updateProject';
import type { UpdateProjectMemberPayload } from 'lib/projects/updateProjectMember';

export function useProjectUpdates(project: ProjectWithMembers) {
  const projectId = project.id;
  const { user } = useUser();
  const { trigger: updateProject } = usePatchProject(projectId);
  // const project = projectsWithMembers?.find((_project) => _project.id === projectId);
  const { trigger: addProjectMember } = useAddProjectMember(projectId);
  const isTeamLead = !!project?.projectMembers.find((pm) => pm.teamLead && pm.userId === user?.id);

  const { showMessage } = useSnackbar();

  const onProjectUpdate = useMemo(
    () =>
      debounce(async (projectPayload: UpdateProjectPayload) => {
        if (!isTeamLead) {
          return null;
        }

        try {
          const updatedProject = await updateProject(projectPayload);
          return updatedProject;
        } catch (_) {
          return null;
        }
      }, 150),
    [projectId, user?.id, isTeamLead]
  );

  const onProjectMemberUpdate = useMemo(
    () =>
      debounce(async (projectMemberPayload: UpdateProjectMemberPayload & { userId?: string }) => {
        if (!isTeamLead && projectMemberPayload.userId !== user?.id) {
          return null;
        }
        return charmClient.projects.updateProjectMember({
          payload: projectMemberPayload,
          projectId
        });
      }, 150),
    [projectId, user?.id, isTeamLead]
  );

  const onProjectMemberAdd = async (projectMemberPayload: AddProjectMemberPayload) => {
    if (!isTeamLead || !project) {
      return null;
    }
    try {
      return addProjectMember(projectMemberPayload);
    } catch (err) {
      showMessage('Failed to add project member', 'error');
      return null;
    }
  };

  return {
    onProjectMemberUpdate,
    onProjectUpdate,
    onProjectMemberAdd
  };
}
