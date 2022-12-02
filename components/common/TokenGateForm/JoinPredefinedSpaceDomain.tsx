import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Accordion, AccordionDetails, AccordionSummary, Alert, Card, Typography } from '@mui/material';
import { Box } from '@mui/system';
import type { Space } from '@prisma/client';
import { useRouter } from 'next/router';
import useSWR from 'swr';

import charmClient from 'charmClient';
import { DiscordGate } from 'components/common/DiscordGate/DiscordGate';
import { useDiscordGate } from 'components/common/DiscordGate/hooks/useDiscordGate';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';

import LoadingComponent from '../LoadingComponent';

import TokenGateForm from './TokenGateForm';

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}

export function JoinPredefinedSpaceDomain({ spaceDomain }: { spaceDomain: string }) {
  const { isValidating, data: spaceInfo } = useSWR('workspace', () =>
    charmClient.getSpaceByDomain(stripUrlParts(spaceDomain))
  );
  const router = useRouter();
  async function onJoinSpace(joinedSpace: Space) {
    router.push(`/${joinedSpace.domain}`);
  }

  const {
    discordGate,
    isConnectedToDiscord,
    isLoading: isLoadingDiscordGate,
    verifyDiscordGate,
    joiningSpace
  } = useDiscordGate({ spaceDomain, onSuccess: onJoinSpace });

  if (!spaceInfo) {
    return isValidating ? (
      <LoadingComponent height='80px' isLoading={true} />
    ) : (
      <>
        <br />
        <Alert severity='error'>No workspace found</Alert>
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
        <LoadingComponent isLoading />
      ) : (
        <>
          <DiscordGate
            isLoadingGate={isLoadingDiscordGate}
            joiningSpace={joiningSpace}
            verifyDiscordGate={verifyDiscordGate}
            discordGate={discordGate}
            isConnectedToDiscord={isConnectedToDiscord}
          />
          <TokenGateForm
            autoVerify
            onSuccess={onJoinSpace}
            spaceDomain={spaceDomain}
            displayAccordion={discordGate?.hasDiscordServer}
          />
        </>
      )}
    </>
  );
}
