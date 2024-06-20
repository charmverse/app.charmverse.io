import { Box, Card, MenuItem, Stack, Typography } from '@mui/material';
import { useCallback, useState } from 'react';
import { FaBriefcase } from 'react-icons/fa';

import { useGetOpProjects, useImportOpProject } from 'charmClient/hooks/projects';
import type { ProjectWithMembers } from 'lib/projects/interfaces';

import { Button } from '../Button';
import { LoadingIcon } from '../LoadingComponent';

export function OpProjectsList({ onImportProject }: { onImportProject: (project: ProjectWithMembers) => void }) {
  const { data: projects = [], isLoading } = useGetOpProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const { trigger: importOpProject, isMutating } = useImportOpProject();

  const selectProject = useCallback(
    (projectId: string) => {
      if (selectedProjectId === projectId) {
        setSelectedProjectId(null);
        return;
      }
      setSelectedProjectId(projectId);
    },
    [selectedProjectId]
  );

  const importProject = useCallback(() => {
    const selectedProject = projects.find((project) => project.attestationUid === selectedProjectId);
    if (selectedProject) {
      importOpProject({
        attestationUid: selectedProject.attestationUid,
        description: selectedProject.description,
        externalLink: selectedProject.externalLink,
        name: selectedProject.name,
        team: selectedProject.team,
        twitter: selectedProject.socialLinks.twitter,
        website: selectedProject.socialLinks.website
      }).then(onImportProject);
    }
  }, [projects, selectedProjectId]);

  if (projects.length === 0) {
    return (
      <Card variant='outlined'>
        <Box p={3} textAlign='center'>
          {isLoading ? (
            <LoadingIcon />
          ) : (
            <>
              <FaBriefcase fontSize='large' color='secondary' />
              <Typography color='secondary'>No projects found on OP</Typography>
            </>
          )}
        </Box>
      </Card>
    );
  }

  return (
    <Stack gap={2}>
      <Stack gap={1}>
        {[...projects, ...projects, ...projects].map((project) => (
          <Stack key={project.attestationUid}>
            <MenuItem
              selected={selectedProjectId === project.attestationUid}
              onClick={() => {
                selectProject(project.attestationUid);
              }}
            >
              <Stack>
                <Typography variant='h6'>{project.name}</Typography>
                <Typography>{project.description}</Typography>
              </Stack>
            </MenuItem>
          </Stack>
        ))}
      </Stack>
      <Button
        sx={{
          width: 'fit-content'
        }}
        onClick={importProject}
        color='primary'
        loading={isMutating}
        disabled={!selectedProjectId}
      >
        Import
      </Button>
    </Stack>
  );
}
