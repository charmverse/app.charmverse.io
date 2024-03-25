import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { useState } from 'react';
import { FormProvider } from 'react-hook-form';

import { useGetProjects, useUpdateProject } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import { defaultProjectFieldConfig, type ProjectWithMembers } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';

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
    projectWithMembers
  });
  const { mutate } = useGetProjects();

  function onUpdateProject() {
    const projectValues = form.getValues();
    const updatedProject = {
      ...projectValues,
      id: projectWithMembers.id,
      projectMembers: projectWithMembers.projectMembers.map((member, index) => ({
        ...member,
        ...projectValues.projectMembers[index],
        id: member.id
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
          <Typography>{projectWithMembers.name}</Typography>
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
  const form = useProjectForm();
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
