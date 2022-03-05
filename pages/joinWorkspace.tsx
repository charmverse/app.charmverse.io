import { useEffect } from 'react';
import { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import getBaseLayout from 'components/common/base-layout/getLayout';
import JoinSpaceForm from 'components/common/JoinSpaceForm';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';

export default function CreateSpace () {

  const [, setUser] = useUser();
  const router = useRouter();

  async function onJoinSpace (space: Space) {
    // refresh user permissions
    const _user = await charmClient.getUser();
    setUser(_user);
    router.push(`/${space.domain}`);
  }

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto' }}>
      <Card sx={{ p: 4 }} variant='outlined'>
        <JoinSpaceForm onSubmit={onJoinSpace} />
      </Card>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
