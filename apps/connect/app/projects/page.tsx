import AddIcon from '@mui/icons-material/AddOutlined';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import { useState } from 'react';

import { PageWrapper } from 'components/common/PageWrapper';
import { CreateProjectForm } from 'components/projects/CreateProjectForm';
import { ProjectsList } from 'components/projects/ProjectsList';

export default function Projects() {
  const [projectView, setProjectView] = useState<'my-projects' | 'create-project' | 'add-project-member'>(
    'my-projects'
  );

  if (projectView === 'my-projects') {
    return (
      <PageWrapper>
        <Box mt={2} gap={2} display='flex' flexDirection='column'>
          <Typography variant='h5'>Your Projects</Typography>
          <ProjectsList />
          <Box gap={2} display='flex' flexDirection='column' my={2} alignItems='center'>
            <Button
              startIcon={<AddIcon fontSize='small' />}
              size='large'
              onClick={() => setProjectView('create-project')}
            >
              Create a project
            </Button>
          </Box>
        </Box>
      </PageWrapper>
    );
  }

  if (projectView === 'create-project') {
    return (
      <PageWrapper>
        <Box mt={2} gap={2} display='flex' flexDirection='column'>
          <Typography variant='h5'>Create a Project</Typography>
          <CreateProjectForm onCancel={() => setProjectView('my-projects')} />
        </Box>
      </PageWrapper>
    );
  }

  return null;
}
