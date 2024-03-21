import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from '@mui/material';

import { useGetProjects } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import type { ProjectWithMembers } from 'components/projects/interfaces';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import Legend from 'components/settings/Legend';

import { CreateProjectForm } from './CreateProjectForm';
import { useGetDefaultProject } from './hooks/useGetDefaultProject';
import { useProject } from './hooks/useProjects';

function ProjectRow({ projectWithMember }: { projectWithMember: ProjectWithMembers }) {
  const { isTeamLead, onProjectMemberAdd, onProjectMemberRemove, isAddingMember, onProjectUpdate } = useProject({
    projectId: projectWithMember.id
  });

  return (
    <Accordion>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{projectWithMember.name}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <ProjectFormAnswers
          defaultRequired={false}
          onMemberRemove={onProjectMemberRemove}
          isTeamLead={isTeamLead}
          fieldConfig={{
            name: {
              required: true
            },
            projectMembers: projectWithMember.projectMembers.map(() => ({
              name: {
                required: true
              }
            }))
          }}
          onChange={onProjectUpdate}
          onMemberAdd={onProjectMemberAdd}
          values={projectWithMember}
          disableAddMemberButton={isAddingMember}
        />
      </AccordionDetails>
    </Accordion>
  );
}

export function ProjectsSettings() {
  useTrackPageView({ type: 'settings/my-projects' });
  const { data } = useGetProjects();
  return (
    <>
      <Legend>My Projects</Legend>
      <Typography variant='h6'>Projects</Typography>
      <Typography variant='caption' mb={1} component='p'>
        Projects can be used to autofill proposal and grant request information.
      </Typography>

      {data && data.length !== 0 && (
        <Box mb={3}>
          {data.map((projectWithMember) => (
            <ProjectRow key={projectWithMember.id} projectWithMember={projectWithMember} />
          ))}
        </Box>
      )}

      <CreateProjectForm />
    </>
  );
}
