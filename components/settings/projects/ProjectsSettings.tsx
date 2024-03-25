import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { useEffect } from 'react';
import { FormProvider } from 'react-hook-form';

import { useGetProjects } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import { defaultProjectFieldConfig, type ProjectWithMembers } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import Legend from 'components/settings/Legend';
import { useUser } from 'hooks/useUser';

import { CreateProjectForm } from './CreateProjectForm';
import { useProject } from './hooks/useProject';
import { useProjectForm } from './hooks/useProjectForm';

function ProjectRow({ projectWithMembers }: { projectWithMembers: ProjectWithMembers }) {
  const { user } = useUser();
  const { onProjectUpdate } = useProject({ projectId: projectWithMembers.id });
  const isTeamLead = projectWithMembers?.projectMembers[0].userId === user?.id;
  const form = useProjectForm({
    projectWithMembers
  });

  const project = form.getValues();
  const isDirty = form.formState.isDirty;
  const isValid = form.formState.isValid;

  useEffect(() => {
    if (isDirty && isValid) {
      onProjectUpdate({
        id: projectWithMembers.id,
        ...project,
        projectMembers: project.projectMembers.map((projectMember, index) => ({
          id: projectWithMembers.projectMembers[index].id,
          ...projectMember
        }))
      });
    }
  }, [project, isDirty, isValid, projectWithMembers, onProjectUpdate]);

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{projectWithMembers.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <FormProvider {...form}>
          <ProjectFormAnswers defaultRequired={false} isTeamLead={isTeamLead} fieldConfig={defaultProjectFieldConfig} />
        </FormProvider>
      </AccordionDetails>
    </Accordion>
  );
}

export function ProjectsSettings() {
  useTrackPageView({ type: 'settings/my-projects' });
  const { data: projectsWithMembers } = useGetProjects();
  const form = useProjectForm();

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
            <ProjectRow key={projectWithMembers.id} projectWithMembers={projectWithMembers} />
          ))}
        </Box>
      )}
      <FormProvider {...form}>
        <CreateProjectForm />
      </FormProvider>
    </>
  );
}
