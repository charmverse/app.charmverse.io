import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import charmClient from 'charmClient';
import { useGetProjects, useUpdateProject } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import Legend from 'components/settings/Legend';
import { ProjectFormAnswers } from 'components/settings/projects/ProjectForm';
import { useUser } from 'hooks/useUser';
import { defaultProjectFieldConfig } from 'lib/projects/constants';
import type { ProjectWithMembers } from 'lib/projects/interfaces';

import { CreateProjectForm } from './CreateProjectForm';
import { useProjectForm } from './hooks/useProjectForm';

function ProjectRow({
  projectWithMembers,
  onExpand,
  isExpanded,
  onClose
}: {
  onClose: VoidFunction;
  onExpand: VoidFunction;
  isExpanded: boolean;
  projectWithMembers: ProjectWithMembers;
}) {
  const { user } = useUser();
  const isTeamLead = projectWithMembers.projectMembers[0].userId === user?.id;
  const { trigger: updateProject, isMutating } = useUpdateProject(projectWithMembers.id);
  const form = useProjectForm({
    projectWithMembers,
    fieldConfig: defaultProjectFieldConfig
  });
  const { mutate } = useGetProjects();
  function onUpdateProject() {
    if (isTeamLead) {
      const projectValues = form.getValues();
      const updatedProject = {
        ...projectValues,
        id: projectWithMembers.id,
        projectMembers: projectValues.projectMembers.map((member, index) => ({
          ...projectWithMembers.projectMembers[index],
          ...member
        }))
      };

      updateProject(updatedProject);

      mutate(
        (projects) => {
          if (!projects || !projectWithMembers) {
            return projects;
          }

          return projects.map((_project) => {
            if (_project.id === projectWithMembers.id) {
              return {
                ..._project,
                ...updatedProject,
                projectMembers: _project.projectMembers.map((projectMember, index) => {
                  return {
                    ...projectMember,
                    ...updatedProject.projectMembers[index]
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
    } else if (user) {
      // TODO: updatedProjectWithMembers leaves out the team Lead from the projectMembers array
      const updatedProjectWithMembers = form.getValues();
      const updatedProjectMemberUserIds = updatedProjectWithMembers.projectMembers.map((member) => member.userId);
      const deletedProjectMember = projectWithMembers.projectMembers.find((member) => {
        if (member.userId === user.id && !updatedProjectMemberUserIds.includes(user.id)) {
          return member;
        }
        return null;
      });

      if (deletedProjectMember) {
        charmClient.removeProjectMember({
          memberId: deletedProjectMember.id,
          projectId: projectWithMembers.id
        });
        mutate((projects) => {
          if (!projects || !projectWithMembers) {
            return projects;
          }

          return projects.filter((_project) => {
            if (_project.id === projectWithMembers.id) {
              return false;
            }

            return true;
          });
        });
      }
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
            onClose();
          }
        }}
      >
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography data-test={`project-title-${projectWithMembers.id}`}>{projectWithMembers.name}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <FormProvider {...form}>
            <ProjectFormAnswers
              defaultRequired={false}
              isTeamLead={isTeamLead}
              fieldConfig={defaultProjectFieldConfig}
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
    </>
  );
}

export function ProjectsSettings() {
  useTrackPageView({ type: 'settings/my-projects' });
  const { data: projectsWithMembers } = useGetProjects();
  const form = useProjectForm({
    fieldConfig: defaultProjectFieldConfig
  });
  const [openedAccordion, setOpenedAccordion] = useState<null | string>(null);

  return (
    <>
      <Legend>My Projects</Legend>
      <Typography variant='h6'>Projects</Typography>
      <Typography variant='caption' mb={1} component='p'>
        Projects can be used to autofill proposal and grant request information.
      </Typography>

      {projectsWithMembers && projectsWithMembers.length !== 0 && (
        <Box mb={3}>
          {projectsWithMembers.map((projectWithMembers) => (
            <ProjectRow
              isExpanded={openedAccordion === projectWithMembers.id}
              onExpand={() => setOpenedAccordion(projectWithMembers.id)}
              onClose={() => setOpenedAccordion(null)}
              key={projectWithMembers.id}
              projectWithMembers={projectWithMembers}
            />
          ))}
        </Box>
      )}
      <FormProvider {...form}>
        <CreateProjectForm
          onAddProject={() => {
            setOpenedAccordion(null);
          }}
        />
      </FormProvider>
    </>
  );
}
