import { Avatar } from '@connect/components/common/Avatar';
import { PageWrapper } from '@connect/components/common/PageWrapper';
import { ProjectsList } from '@connect/components/projects/ProjectsList';
import AddIcon from '@mui/icons-material/AddOutlined';
import { Button, Card, CardContent, Typography } from '@mui/material';
import { Box } from '@mui/system';
import Link from 'next/link';

export default function Projects() {
  return (
    <PageWrapper>
      <Box mt={2} gap={2} display='flex' flexDirection='column'>
        <Typography variant='h5' align='center'>
          Onchain Summer
        </Typography>
        <Card>
          <CardContent sx={{ display: 'flex', gap: 2 }}>
            <Avatar
              size='xLarge'
              name='ccarella.eth'
              avatar='https://cdn.charmverse.io/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/0925e1d3-5d71-4bea-a9d2-274e9cfab80d/Noun-839.jpg'
            />
            <Box>
              <Typography>Ccarella</Typography>
              <Typography>Memetic-Artist. Techno-Optimist.</Typography>
              <Typography>Purple. Energy. Nouns. Optimism</Typography>
              <Typography>@CharmVerse</Typography>
            </Box>
          </CardContent>
        </Card>
        <Box display='flex' flexDirection='column'>
          <Typography>Username: ccarella.eth</Typography>
          <Typography>Email: ccarella@test.com</Typography>
        </Box>
        <Box gap={2} display='flex' flexDirection='column' my={2} alignItems='center'>
          <Link href='/create-project' passHref>
            <Button startIcon={<AddIcon fontSize='small' />} size='large'>
              Create a project
            </Button>
          </Link>
        </Box>
        <Typography variant='h6'>Your Projects</Typography>
        <ProjectsList userProjects />
      </Box>
    </PageWrapper>
  );
}
