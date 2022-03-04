import { useEffect } from 'react';
import { Prisma } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import getBaseLayout from 'components/common/base-layout/getLayout';
import CreateSpaceForm, { getDomainFromName } from 'components/common/CreateSpaceForm';
import charmClient from 'charmClient';
import { useSpaces } from 'hooks/useSpaces';
import { useUser } from 'hooks/useUser';
import getDisplayName from 'lib/users/getDisplayName';

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
    router.push(`/${space.domain}`);
  }

  const defaultName = `${getDisplayName(user!)}'s Workspace`;
  const defaultValues = {
    name: defaultName,
    domain: getDomainFromName(defaultName)
  };

  useEffect(() => {
    if (spaces.length > 0) {
      router.push(`/${spaces[0].domain}`);
    }
  }, []);

  return (
    <Box sx={{ width: 400, maxWidth: '100%', mx: 'auto' }}>
      <Card sx={{ p: 4 }} variant='outlined'>
        <CreateSpaceForm defaultValues={defaultValues} onSubmit={addSpace} submitText='Get Started' />
      </Card>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
