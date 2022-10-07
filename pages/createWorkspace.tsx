import Box from '@mui/material/Box';
import Card from '@mui/material/Card';

import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import CreateSpaceForm from 'components/common/CreateSpaceForm';
import { useSpaces } from 'hooks/useSpaces';

import { AlternateRouteButton } from './join';

export default function CreateSpace () {
  const { createNewSpace, isCreatingSpace } = useSpaces();

  return (
    <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto', px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <CreateSpaceForm onSubmit={createNewSpace} isSubmitting={isCreatingSpace} submitText='Get Started' />
      </Card>
      <AlternateRouteButton href='/join'>
        Join a workspace
      </AlternateRouteButton>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
