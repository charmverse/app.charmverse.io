import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Divider, Typography, Accordion, AccordionDetails, AccordionSummary, Stack } from '@mui/material';
import { useState } from 'react';

import { useCreateProject, useGetProjects } from 'charmClient/hooks/projects';
import { useTrackPageView } from 'charmClient/hooks/track';
import { Button } from 'components/common/Button';
import type { ProjectValues } from 'components/projects/interfaces';
import { projectDefaultValues } from 'components/projects/ProjectFields';
import { ProjectFormAnswers } from 'components/projects/ProjectForm';
import { projectMemberDefaultValues } from 'components/projects/ProjectMemberFields';
import Legend from 'components/settings/Legend';

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

      {!project && data && data.length !== 0 && (
        <Box mb={3}>
          {data.map((projectWithMember) => (
            <Accordion key={projectWithMember.id}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography>{projectWithMember.name}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <ProjectFormAnswers
                  fieldConfig={{
                    name: {
                      required: true
                    },
                    members: [
                      {
                        name: {
                          required: true
                        }
                      }
                    ]
                  }}
                  onChange={setProject}
                  values={projectWithMember}
                  showAddTeamMemberButton
                />
              </AccordionDetails>
            </Accordion>
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
            fieldConfig={{
              name: {
                required: true
              },
              members: [
                {
                  name: {
                    required: true
                  }
                }
              ]
            }}
            onChange={setProject}
            values={project}
            showAddTeamMemberButton
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
              members: [projectMemberDefaultValues]
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
