import { useEffect } from 'react';
import { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import getBaseLayout from 'components/common/base-layout/getLayout';
import JoinSpaceForm from 'components/common/JoinSpaceForm';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useSpaces } from 'hooks/useSpaces';

export default function CreateSpace () {

  const [, setUser] = useUser();
  const [, setSpaces] = useSpaces();
  const router = useRouter();

  async function onJoinSpace (space: Space) {
    // refresh user permissions
    const _user = await charmClient.getUser();
    setUser(_user);
    charmClient.getSpaces()
      .then(_spaces => {
        setSpaces(_spaces);
        if (typeof router.query.returnUrl === 'string') {
          router.push(router.query.returnUrl);
        }
        else {
          router.push(`/${space.domain}`);
        }
      });
  }

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6 }}>
      <Card sx={{ p: 4 }} variant='outlined'>
        <JoinSpaceForm onSubmit={onJoinSpace} />
      </Card>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
