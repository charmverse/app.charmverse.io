import { Alert, Card, Typography, Box } from '@mui/material';
import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { DiscordGate } from 'components/common/SpaceAccessGate/components/DiscordGate/DiscordGate';
import { useDiscordGate } from 'components/common/SpaceAccessGate/components/DiscordGate/hooks/useDiscordGate';
import { SummonGate } from 'components/common/SpaceAccessGate/components/SummonGate/SummonGate';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';
import type { TokenGateJoinType } from 'lib/token-gates/interfaces';

import LoadingComponent from '../LoadingComponent';

import { TokenGate } from './components/TokenGate/TokenGate';

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

export function SpaceAccessGate({
  spaceDomain,
  onSuccess,
  joinType
}: {
  spaceDomain: string;
  joinType?: TokenGateJoinType;
  onSuccess?: (values: Space) => void;
}) {
  const { isValidating, data: spaceInfo } = useSWR('workspace', () =>
    charmClient.getSpaceByDomain(stripUrlParts(spaceDomain))
  );
  const router = useRouter();
  async function onJoinSpace(joinedSpace: Space) {
    if (onSuccess) {
      onSuccess(joinedSpace);
    } else {
      router.push(`/${joinedSpace.domain}`);
    }
  }

  const {
    discordGate,
    isConnectedToDiscord,
    isLoading: isLoadingDiscordGate,
    verify: verifyDiscordGate,
    joiningSpace
  } = useDiscordGate({ spaceDomain, onSuccess: onJoinSpace });
  if (!spaceInfo) {
    return isValidating ? (
      <LoadingComponent height='80px' isLoading={true} />
    ) : (
      <>
        <br />
        <Alert severity='error'>No space found</Alert>
      </>
    );
  }

  return (
    <>
      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box mb={3}>
          <WorkspaceAvatar image={spaceInfo.spaceImage} name={spaceInfo.name} variant='rounded' />
        </Box>
        <Box display='flex' flexDirection='column' alignItems='center'>
          <Typography variant='h5'>{spaceInfo.name}</Typography>
        </Box>
      </Card>

      {isLoadingDiscordGate ? (
        <Box mt={3}>
          <LoadingComponent isLoading />
        </Box>
      ) : (
        <>
          <DiscordGate
            isLoadingGate={isLoadingDiscordGate}
            joiningSpace={joiningSpace}
            verifyDiscordGate={verifyDiscordGate}
            discordGate={discordGate}
            isConnectedToDiscord={isConnectedToDiscord}
          />
          <SummonGate spaceDomain={spaceDomain} onLoad={onLoadSummonGate} onSuccess={onJoinSpace} />
          <TokenGate
            autoVerify
            joinType={joinType}
            onSuccess={onJoinSpace}
            spaceDomain={spaceDomain}
            displayAccordion={discordGate?.hasDiscordServer}
          />
        </>
      )}
    </>
  );
}
