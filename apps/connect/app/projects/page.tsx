import AddIcon from '@mui/icons-material/AddOutlined';
import { Button, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Link from 'next/link';

import { PageWrapper } from 'components/common/PageWrapper';
import { ProjectsList } from 'components/projects/ProjectsList';

export default function Projects() {
  return (
    <PageWrapper>
      <Box mt={2} gap={2} display='flex' flexDirection='column'>
        <Typography variant='h5'>Your Projects</Typography>
        <ProjectsList userProjects />
        <Box gap={2} display='flex' flexDirection='column' my={2} alignItems='center'>
          <Link href='/create-project' passHref>
            <Button startIcon={<AddIcon fontSize='small' />} size='large'>
              Create a project
            </Button>
          </Link>
        </Box>
      </Box>
    </PageWrapper>
  );
}
