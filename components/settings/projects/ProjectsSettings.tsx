import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Box, Divider, Stack, Typography } from '@mui/material';
import debounce from 'lodash/debounce';
import { useMemo, useState } from 'react';
import type { KeyedMutator } from 'swr';

import charmClient from 'charmClient';
import { useAddProjectMember, useCreateProject, useGetProjects, useUpdateProject } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import type { ProjectValues, ProjectWithMembers } from 'components/projects/interfaces';
import { projectDefaultValues } from 'components/projects/ProjectFields';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';
import Legend from 'components/settings/Legend';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';

import { useProject } from './hooks/useProjects';

function ProjectRow({
  mutate,
  projectWithMember
}: {
  projectWithMember: ProjectWithMembers;
  mutate: KeyedMutator<ProjectWithMembers[]>;
}) {
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
  const [project, setProject] = useState<ProjectValues | null>(null);
  const { trigger: createProject, isMutating } = useCreateProject();
  const { mutate, data } = useGetProjects();

  async function saveProject() {
    if (!project) {
      return;
    }

    try {
      const createdProjectWithMember = await createProject(project);
      setProject(null);
      mutate(
        (cachedData) => {
          if (!cachedData) {
            return cachedData;
          }

          return [...cachedData, createdProjectWithMember];
        },
        {
          revalidate: false
        }
      );
    } catch (err) {
      //
    }
  }

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
            <ProjectRow mutate={mutate} key={projectWithMember.id} projectWithMember={projectWithMember} />
          ))}
        </Box>
      )}

      {project && (
        <Box mb={3}>
          <Divider
            sx={{
              my: 1
            }}
          />
          <ProjectFormAnswers
            defaultRequired={false}
            fieldConfig={{
              name: {
                required: true
              },
              projectMembers: project.projectMembers.map(() => ({
                name: {
                  required: true
                }
              }))
            }}
            onChange={setProject}
            isTeamLead
            onMemberRemove={(memberIndex) => {
              setProject({
                ...project,
                projectMembers: project.projectMembers.filter((_, index) => index !== memberIndex)
              });
            }}
            onMemberAdd={() => {
              setProject({
                ...project,
                projectMembers: [...project.projectMembers, projectMemberDefaultValues]
              });
            }}
            values={project}
          />
        </Box>
      )}

      {project ? (
        <Stack gap={1} flexDirection='row'>
          <Button disabled={isMutating} onClick={saveProject}>
            Save
          </Button>
          <Button
            disabled={isMutating}
            variant='outlined'
            color='error'
            onClick={() => {
              setProject(null);
            }}
          >
            Cancel
          </Button>
        </Stack>
      ) : (
        <Button
          disabled={isMutating}
          onClick={() => {
            setProject({
              ...projectDefaultValues,
              projectMembers: [projectMemberDefaultValues]
            });
          }}
          startIcon={<AddIcon fontSize='small' />}
        >
          Add a project
        </Button>
      )}
    </>
  );
}
