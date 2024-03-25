import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';
import { FormProvider } from 'react-hook-form';

import { useGetProjects } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import { defaultProjectFieldConfig, type ProjectWithMembers } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import Legend from 'components/settings/Legend';

import { CreateProjectForm } from './CreateProjectForm';
import { useProject } from './hooks/useProject';
import { useProjectForm } from './hooks/useProjectForm';

function ProjectRowFormAnswers({ projectWithMembers }: { projectWithMembers: ProjectWithMembers }) {
  const { form, isTeamLead } = useProject({ projectWithMembers });

  return (
    <FormProvider {...form}>
      <ProjectFormAnswers defaultRequired={false} isTeamLead={isTeamLead} fieldConfig={defaultProjectFieldConfig} />
    </FormProvider>
  );
}

function ProjectRow({ projectWithMembers }: { projectWithMembers: ProjectWithMembers }) {
  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{projectWithMembers.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <ProjectRowFormAnswers projectWithMembers={projectWithMembers} />
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
