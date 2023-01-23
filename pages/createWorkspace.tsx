import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import { CreateSpaceForm } from 'components/common/CreateSpaceForm/CreateSpaceForm';

import { AlternateRouteButton } from './join';

export default function CreateSpace() {
  return (
    <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto', px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <CreateSpaceForm submitText='Get Started' />
      </Card>
      <AlternateRouteButton href='/join'>Join a workspace</AlternateRouteButton>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
