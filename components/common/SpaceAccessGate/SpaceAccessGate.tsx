import { Card, Typography, Box } from '@mui/material';
import { useRouter } from 'next/router';

import { DiscordGate } from 'components/common/SpaceAccessGate/components/DiscordGate/DiscordGate';
import { useDiscordGate } from 'components/common/SpaceAccessGate/components/DiscordGate/hooks/useDiscordGate';
import { SummonGate } from 'components/common/SpaceAccessGate/components/SummonGate/SummonGate';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';
import type { SpaceWithGates } from 'lib/spaces/interfaces';
import type { TokenGateJoinType } from 'lib/token-gates/interfaces';

import LoadingComponent from '../LoadingComponent';

import { TokenGate } from './components/TokenGate/TokenGate';

export function SpaceAccessGate({
  space,
  onSuccess,
  joinType
}: {
  space: SpaceWithGates;
  joinType?: TokenGateJoinType;
  onSuccess?: () => void;
}) {
  const router = useRouter();

  function onJoinSpace() {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/${space.domain}`);
    }
  }

  const {
    discordGate,
    isConnectedToDiscord,
    isLoading: isLoadingDiscordGate,
    joinSpace: joinSpaceByDiscordGate,
    joiningSpace
  } = useDiscordGate({ spaceDomain: space.domain, onSuccess: onJoinSpace });

  return (
    <>
      <Card sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box mb={3}>
          <WorkspaceAvatar image={space.spaceImage} name={space.name} variant='rounded' />
        </Box>
        <Box display='flex' flexDirection='column' alignItems='center'>
          <Typography variant='h5'>{space.name}</Typography>
        </Box>
      </Card>

      {isLoadingDiscordGate ? (
        <LoadingComponent isLoading />
      ) : (
        <>
          <Typography variant='body2' align='center' gutterBottom>
            Connect and verify your wallet to join this space
          </Typography>
          <DiscordGate
            isLoadingGate={isLoadingDiscordGate}
            joiningSpace={joiningSpace}
            joinSpace={joinSpaceByDiscordGate}
            discordGate={discordGate}
            isConnectedToDiscord={isConnectedToDiscord}
          />
          <SummonGate space={space} onSuccess={onJoinSpace} />
          <TokenGate
            autoVerify
            joinType={joinType}
            onSuccess={onJoinSpace}
            spaceDomain={space.domain}
            displayAccordion={discordGate?.hasDiscordServer}
          />
        </>
      )}
    </>
  );
}
