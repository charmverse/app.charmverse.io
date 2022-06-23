import { Prisma } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import getBaseLayout from 'components/common/BaseLayout/BaseLayout';
import CreateSpaceForm, { getDomainFromName } from 'components/common/CreateSpaceForm';
import charmClient from 'charmClient';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import getDisplayName from 'lib/users/getDisplayName';
import { AlternateRouteButton } from './join';

export default function CreateSpace () {

  const [user, setUser] = useUser();
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

  const defaultName = `${getDisplayName(user!)}'s Workspace`;
  const defaultValues = {
    name: defaultName,
    domain: getDomainFromName(defaultName)
  };

  return (
    <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto' }}>
      <Card sx={{ p: 4, mb: 3 }} variant='outlined'>
        <CreateSpaceForm onSubmit={addSpace} submitText='Get Started' />
      </Card>
      <AlternateRouteButton href='/join'>
        Join an existing workspace
      </AlternateRouteButton>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
