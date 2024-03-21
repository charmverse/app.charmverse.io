import { debounce } from 'lodash';
import { useMemo } from 'react';

import charmClient from 'charmClient';
import { useUpdateProject, useAddProjectMember, useGetProjects } from 'charmClient/hooks/projects';
import { defaultProjectFieldConfig } from 'components/projects/interfaces';
import type { ProjectEditorFieldConfig, ProjectValues } from 'components/projects/interfaces';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import { useProjectForm } from './useProjectForm';

export function useProject({
  fieldConfig = defaultProjectFieldConfig,
  projectId,
  defaultRequired
}: {
  fieldConfig?: ProjectEditorFieldConfig;
  defaultRequired?: boolean;
  projectId: string;
}) {
  const { mutate, data: projectsWithMembers } = useGetProjects();
  const { trigger: updateProject } = useUpdateProject({ projectId });
  const { trigger: addProjectMember, isMutating: isAddingMember } = useAddProjectMember({ projectId });
  const { user } = useUser();
  const projectWithMember = projectsWithMembers?.find((project) => project.id === projectId);
  const isTeamLead = projectWithMember?.projectMembers[0].userId === user?.id;

  const { control, yupSchema, isValid, errors } = useProjectForm({
    defaultValues: projectWithMember,
    fieldConfig,
    defaultRequired
  });

  const { showMessage } = useSnackbar();
  const debouncedUpdate = useMemo(() => {
    return debounce(updateProject, 300);
  }, [updateProject]);

  async function onProjectUpdate(_project: ProjectValues) {
    let _isValid = false;
    try {
      // Validate project separate since there is a lag
      await yupSchema.current.validate(_project);
      _isValid = true;
    } catch (_) {
      _isValid = false;
    }
    if (!projectWithMember || !isTeamLead || !_isValid) {
      return;
    }

    try {
      // Add ids to project & projectMembers
      await debouncedUpdate({
        id: projectWithMember.id,
        ..._project,
        projectMembers: _project.projectMembers.map((projectMember, index) => {
          return {
            ...projectWithMember.projectMembers[index],
            ...projectMember
          };
        })
      });

      mutate(
        (projects) => {
          if (!projects) {
            return projects;
          }

          return projects.map((project) => {
            if (project.id === projectId) {
              return {
                ...project,
                ..._project,
                projectMembers: _project.projectMembers.map((projectMember, index) => {
                  return {
                    ...project.projectMembers[index],
                    ...projectMember
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

  async function onProjectMemberAdd() {
    if (!projectWithMember || !isTeamLead) {
      return;
    }

    try {
      const addedProjectMember = await addProjectMember();
      mutate((projects) => {
        if (!projects) {
          return projects;
        }

        return projects.map((project) => {
          if (project.id === projectId) {
            return {
              ...project,
              projectMembers: [...project.projectMembers, addedProjectMember]
            };
          }

          return project;
        });
      });
    } catch (_) {
      showMessage('Failed to add project member', 'error');
    }
  }

  async function onProjectMemberRemove(memberIndex: number) {
    if (!projectWithMember || !isTeamLead) {
      return;
    }

    const memberId = projectWithMember.projectMembers[memberIndex]?.id;
    if (!memberId) {
      return;
    }

    try {
      await charmClient.removeProjectMember({
        projectId: projectWithMember.id,
        memberId
      });
      mutate((projects) => {
        if (!projects) {
          return projects;
        }

        return projects.map((project) => {
          if (project.id === projectWithMember.id) {
            return {
              ...project,
              projectMembers: project.projectMembers.filter((_, index) => index !== memberIndex)
            };
          }

          return project;
        });
      });
    } catch (_) {
      showMessage('Failed to remove project member', 'error');
    }
  }

  return {
    errors,
    control,
    isValid,
    isAddingMember,
    isTeamLead,
    onProjectUpdate,
    onProjectMemberAdd,
    onProjectMemberRemove
  };
}
