import { Box, Card, ListItem, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import { FaBriefcase } from 'react-icons/fa';

import { useGetOpProjects } from 'charmClient/hooks/projects';

import { Button } from '../Button';
import { LoadingIcon } from '../LoadingComponent';

export function OpProjectsList() {
  const { data: projects = [], isLoading } = useGetOpProjects();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
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
    <Stack>
      {projects.map((project) => (
        <Stack key={project.name}>
          <ListItem>
            <Typography>{project.name}</Typography>
          </ListItem>
        </Stack>
      ))}
      <Button color='primary' disabled={!selectedProjectId}>
        Import
      </Button>
    </Stack>
  );
}
