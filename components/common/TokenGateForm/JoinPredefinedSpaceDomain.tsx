import { Card, Typography, Alert } from '@mui/material';
import { Box } from '@mui/system';
import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';

import LoadingComponent from '../LoadingComponent';

import TokenGateForm from './TokenGateForm';

function stripUrlParts (maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

export function JoinPredefinedSpaceDomain ({ spaceDomain }: { spaceDomain: string }) {
  const { isValidating, data: spaceInfo } = useSWR('workspace', () => charmClient.getSpaceByDomain(stripUrlParts(spaceDomain)));
  const router = useRouter();

  async function onJoinSpace (joinedSpace: Space) {
    router.push(`/${joinedSpace.domain}`);
  }

  if (isValidating) {
    return <LoadingComponent height='80px' isLoading={true} />;
  }

  return (
    <>
      {spaceInfo && (
        <>
          <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
            <Box mb={3}>
              <WorkspaceAvatar image={spaceInfo.spaceImage} name={spaceInfo.name} variant='rounded' />
            </Box>
            <Box display='flex' flexDirection='column' alignItems='center'>
              <Typography variant='h5'>{spaceInfo.name}</Typography>
            </Box>
          </Card>
          <TokenGateForm onSuccess={onJoinSpace} spaceDomain={spaceDomain} />
        </>
      )}
      {!spaceInfo && !isValidating && (
        <>
          <br />
          <Alert severity='error'>
            No workspace found
          </Alert>
        </>
      )}
    </>
  );
}
