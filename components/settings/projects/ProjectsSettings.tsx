import { DeleteOutlined } from '@mui/icons-material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Stack,
  Typography
} from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useGetProjects, useUpdateProject } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { ContextMenu } from 'components/common/ContextMenu';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';
import { defaultProjectAndMembersFieldConfig } from 'lib/projects/constants';
import type { ProjectWithMembers } from 'lib/projects/interfaces';

import { CreateProjectForm } from './components/CreateProjectForm';
import { ProjectFormAnswers } from './components/ProjectForm';
import { useProjectForm } from './hooks/useProjectForm';

function ProjectRow({
  projectWithMembers,
  onExpand,
  isExpanded,
  onClose,
  mutate
}: {
  onClose: VoidFunction;
  onExpand: VoidFunction;
  isExpanded: boolean;
  projectWithMembers: ProjectWithMembers;
  mutate: KeyedMutator<ProjectWithMembers[]>;
}) {
  const { user } = useUser();
  const isTeamLead = projectWithMembers.projectMembers[0].userId === user?.id;
  const { trigger: updateProject, isMutating } = useUpdateProject(projectWithMembers.id);
  const form = useProjectForm({
    projectId: projectWithMembers.id,
    fieldConfig: defaultProjectAndMembersFieldConfig
  });
  const removeProjectMemberPopupState = usePopupState({
    variant: 'popover',
    popupId: `remove-member-${projectWithMembers.id}`
  });

  async function removeProjectMember() {
    const deletedProjectMember = projectWithMembers.projectMembers.find((member) => member.userId === user?.id);

    if (deletedProjectMember) {
      await charmClient.projects.removeProjectMember({
        memberId: deletedProjectMember.id,
        projectId: projectWithMembers.id
      });
      mutate(
        (projects) => {
          if (!projects || !projectWithMembers) {
            return projects;
          }

          return projects.filter((_project) => _project.id !== projectWithMembers.id);
        },
        {
          revalidate: false
        }
      );
    }
  }

  function onUpdateProject() {
    const projectValues = form.getValues();
    if (isTeamLead) {
      updateProject(
        {
          ...projectValues,
          projectMembers: projectValues.projectMembers.map((member, index) => ({
            ...projectWithMembers.projectMembers[index],
            ...member
          }))
        },
        {
          onSuccess(updatedProject) {
            form.reset(updatedProject, {
              keepDirty: false
            });

            mutate(
              (projects) => {
                if (!projects || !projectWithMembers) {
                  return projects;
                }

                return projects.map((_project) => {
                  if (_project.id === projectWithMembers.id) {
                    return updatedProject;
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
      );
    } else {
      const projectMemberValue = projectValues.projectMembers.find((member) => member.userId === user?.id);
      if (!projectMemberValue || !projectMemberValue.id) {
        return;
      }

      charmClient.projects
        .updateProjectMember({
          memberId: projectMemberValue.id,
          payload: projectMemberValue,
          projectId: projectWithMembers.id
        })
        .then((updatedProjectMember) => {
          mutate(
            (projects) => {
              if (!projects || !projectWithMembers) {
                return projects;
              }

              return projects.map((_project) => {
                if (_project.id === projectWithMembers.id) {
                  return {
                    ..._project,
                    projectMembers: _project.projectMembers.map((projectMember) => {
                      if (projectMember.userId === user?.id) {
                        return updatedProjectMember;
                      }
                      return projectMember;
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
        });
    }
    onClose();
  }

  return (
    <>
      <Accordion
        expanded={isExpanded}
        onChange={(_, expanded) => {
          if (expanded) {
            onExpand();
          } else {
            form.reset();
            onClose();
          }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Stack width='100%' flexDirection='row' justifyContent='space-between' alignItems='center'>
            <Typography data-test={`project-title-${projectWithMembers.id}`}>
              {projectWithMembers.name || 'Untitled'}
            </Typography>
            {!isTeamLead && (
              <Stack
                flexDirection='row'
                justifyContent='space-between'
                alignItems='center'
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <ContextMenu iconSize='small' popupId={`menu-${projectWithMembers.id}`}>
                  <MenuItem onClick={removeProjectMemberPopupState.open}>
                    <ListItemIcon>
                      <DeleteOutlined fontSize='small' />
                    </ListItemIcon>
                    <ListItemText>Leave project</ListItemText>
                  </MenuItem>
                </ContextMenu>
              </Stack>
            )}
          </Stack>
        </AccordionSummary>
        <AccordionDetails>
          <FormProvider {...form}>
            <ProjectFormAnswers
              defaultRequired={false}
              isTeamLead={isTeamLead}
              fieldConfig={defaultProjectAndMembersFieldConfig}
            />
          </FormProvider>
        </AccordionDetails>
      </Accordion>
      {isExpanded && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            py: 1,
            px: { xs: 5, md: 0 },
            position: 'sticky',
            bottom: '0',
            background: (theme) => theme.palette.background.paper,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`
          }}
        >
          <Button
            disabledTooltip={!form.formState.isValid ? 'Please fill out all required fields' : ''}
            disabled={isMutating || !form.formState.isValid || !form.formState.isDirty}
            onClick={onUpdateProject}
            data-test='save-project-button'
          >
            Save
          </Button>
        </Box>
      )}
      <ConfirmDeleteModal
        title='Leave project'
        onClose={removeProjectMemberPopupState.close}
        open={removeProjectMemberPopupState.isOpen}
        buttonText='Leave'
        question='Are you sure you want to leave this project?'
        onConfirm={removeProjectMember}
      />
    </>
  );
}

export function ProjectsSettings() {
  useTrackPageView({ type: 'settings/my-projects' });
  const { data: projectsWithMembers, mutate } = useGetProjects();
  const form = useProjectForm({
    fieldConfig: defaultProjectAndMembersFieldConfig
  });
  const [openedAccordion, setOpenedAccordion] = useState<null | string>(null);
  const [isCreateProjectFormOpen, setIsCreateProjectFormOpen] = useState(false);

  return (
    <>
      <Legend>My Projects</Legend>
      <Typography variant='h6'>Projects</Typography>
      <Box display='flex' alignItems='center' justifyContent='space-between' mb={2}>
        <Typography variant='body1'>
          Projects can be used to autofill proposal and grant request information.
        </Typography>
        <Button
          size='small'
          data-test='add-project-button'
          onClick={() => {
            setOpenedAccordion(null);
            setIsCreateProjectFormOpen(true);
          }}
        >
          New
        </Button>
      </Box>

      {isCreateProjectFormOpen && (
        <FormProvider {...form}>
          <CreateProjectForm
            onCancel={() => {
              setIsCreateProjectFormOpen(false);
            }}
            onSave={() => {
              setIsCreateProjectFormOpen(false);
            }}
          />
        </FormProvider>
      )}

      {projectsWithMembers && projectsWithMembers.length !== 0 && (
        <Box mb={3}>
          {projectsWithMembers.map((projectWithMembers) => (
            <ProjectRow
              mutate={mutate}
              isExpanded={openedAccordion === projectWithMembers.id}
              onExpand={() => setOpenedAccordion(projectWithMembers.id)}
              onClose={() => setOpenedAccordion(null)}
              key={projectWithMembers.id}
              projectWithMembers={projectWithMembers}
            />
          ))}
        </Box>
      )}
    </>
  );
}
