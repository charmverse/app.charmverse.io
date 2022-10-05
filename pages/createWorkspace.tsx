import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import type { Prisma } from '@prisma/client';
import { useRouter } from 'next/router';

import charmClient from 'charmClient';
import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import CreateSpaceForm from 'components/common/CreateSpaceForm';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';

import { AlternateRouteButton } from './join';

export default function CreateSpace () {
  const { setUser } = useUser();
  const [spaces, setSpaces] = useSpaces();
  const router = useRouter();

  async function addSpace (newSpace: Prisma.SpaceCreateInput) {

    const space = await charmClient.createSpace(newSpace);
    setSpaces([...spaces, space]);
    // refresh user permissions
    const _user = await charmClient.getUser();
    setUser(_user);
    // give some time for spaces state to update or user will be redirected to /join in RouteGuard
    setTimeout(() => {
      router.push(`/${space.domain}`);
    }, 50);
  }

  return (
    <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto', px: 2 }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <CreateSpaceForm onSubmit={addSpace} submitText='Get Started' />
      </Card>
      <AlternateRouteButton href='/join'>
        Join a workspace
      </AlternateRouteButton>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
