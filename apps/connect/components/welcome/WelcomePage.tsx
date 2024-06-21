import { Card, CardContent } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { Avatar } from 'components/common/Avatar';
import { PageWrapper } from 'components/common/PageWrapper';

import { ExtraDetails } from './ExtraDetails';

export function WelcomePage({ user }: { user: any }) {
  return (
    <PageWrapper display='flex' gap={2} flexDirection='column'>
      <Box textAlign='center'>
        <Typography variant='h3' component='h1' my={2}>
          Welcome
        </Typography>
        <Typography>
          This is your profile. You can use it to create projects which can be used with Optimism's grant programs.
        </Typography>
      </Box>
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
      <Box mt={2} display='flex' gap={2} flexDirection='column'>
        <Typography>Username: ccarella.eth</Typography>
        <Typography>Email: ccarella@test.com</Typography>
        <ExtraDetails />
      </Box>
    </PageWrapper>
  );
}
