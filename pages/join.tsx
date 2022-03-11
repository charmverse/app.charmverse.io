import { useEffect } from 'react';
import { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import getBaseLayout from 'components/common/base-layout/getLayout';
import TokenGateForm from 'components/common/TokenGateForm';
import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import { useSpaces } from 'hooks/useSpaces';

export default function CreateSpace () {

  const router = useRouter();
  const [spaces] = useSpaces();

  async function onJoinSpace (space: Space) {
    if (typeof router.query.returnUrl === 'string') {
      router.push(router.query.returnUrl);
    }
    else {
      router.push(`/${space.domain}`);
    }
  }
  useEffect(() => {
    if (spaces.some(space => space.domain === router.query.domain)) {
      router.push(`/${router.query.domain}`);
    }
  }, [spaces]);

  return (
    <Box sx={{ width: 600, maxWidth: '100%', mx: 'auto', mb: 6 }}>
      <Card sx={{ p: 4 }} variant='outlined'>
        <TokenGateForm onSubmit={onJoinSpace} />
      </Card>
    </Box>
  );
}

CreateSpace.getLayout = getBaseLayout;
