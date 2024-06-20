'use client';

import { Box } from '@mui/material';
import Button from '@mui/material/Button';
import { useState } from 'react';

import { ProjectForm } from './ProjectForm';

export function CreateProjectButton() {
  const [showCreateProjectForm, setShowCreateProjectForm] = useState(false);

  if (showCreateProjectForm) {
    return <ProjectForm onCancel={() => setShowCreateProjectForm(false)} />;
  }

  return (
    <Box gap={2} display='flex' flexDirection='column' my={2} alignItems='center'>
      <Button size='large' onClick={() => setShowCreateProjectForm(true)}>
        Create a project
      </Button>
    </Box>
  );
}
