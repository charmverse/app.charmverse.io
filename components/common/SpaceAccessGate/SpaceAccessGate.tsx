import { Alert, Card, Typography, Box } from '@mui/material';
import { useRouter } from 'next/router';

import PrimaryButton from 'components/common/PrimaryButton';
import { WalletSign } from 'components/login';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { AuthSig } from 'lib/blockchain/interfaces';
import type { SpaceWithGates } from 'lib/spaces/interfaces';
import type { TokenGateJoinType } from 'lib/token-gates/interfaces';

import { DiscordGate } from './components/DiscordGate/DiscordGate';
import { useDiscordGate } from './components/DiscordGate/hooks/useDiscordGate';
import { useSummonGate } from './components/SummonGate/hooks/useSummonGate';
import { SummonGate } from './components/SummonGate/SummonGate';
import { useTokenGates } from './components/TokenGate/hooks/useTokenGates';
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
  const { showMessage } = useSnackbar();
  const { user } = useUser();
  const { loginFromWeb3Account } = useWeb3AuthSig();

  const discordGate = useDiscordGate({
    joinType,
    spaceDomain: space.domain,
    onSuccess: onJoinSpace
  });

  const summonGate = useSummonGate({
    joinType,
    space,
    onSuccess: onJoinSpace
  });

  const tokenGate = useTokenGates({
    autoVerify: true,
    joinType,
    space,
    onSuccess: onJoinSpace
  });

  function onJoinSpace() {
    if (onSuccess) {
      onSuccess();
    } else {
      router.push(`/${space.domain}`);
    }
  }

  async function onWalletSignature(authSig: AuthSig) {
    if (!user) {
      try {
        await loginFromWeb3Account(authSig);
      } catch (err: any) {
        showMessage(err?.message ?? 'An unknown error occurred', err?.severity ?? 'error');
        return;
      }
    }
    await tokenGate.evaluateEligibility(authSig);
  }

  function joinSpace() {
    if (summonGate.isVerified) {
      summonGate.joinSpace();
    } else if (tokenGate.isVerified) {
      tokenGate.joinSpace();
    } else if (discordGate.isVerified) {
      discordGate.joinSpace();
    } else {
      showMessage('You are not eligible to join this space', 'error');
    }
  }

  const walletGateEnabled = summonGate.isEnabled || tokenGate.isEnabled;
  const isVerified = summonGate.isVerified || tokenGate.isVerified || discordGate.isVerified;
  const isJoiningSpace = summonGate.joiningSpace || tokenGate.joiningSpace || discordGate.joiningSpace;

  const noGateConditions = !discordGate.isEnabled && !summonGate.isEnabled && !tokenGate.isEnabled;

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
      {walletGateEnabled && (
        <Typography variant='body2' align='center' sx={{ mb: 2 }}>
          The following criteria must be met to join this space:
        </Typography>
      )}

      {discordGate.isEnabled && <DiscordGate {...discordGate} />}

      {summonGate.isEnabled && <SummonGate {...summonGate} />}

      {summonGate.isEnabled && tokenGate.isEnabled && (
        <Typography color='secondary' align='center'>
          OR
        </Typography>
      )}

      {tokenGate.isEnabled && <TokenGate {...tokenGate} displayAccordion={discordGate.isEnabled} />}

      {isVerified && (
        <Box mb={2}>
          <PrimaryButton
            data-test='join-space-button'
            fullWidth
            loading={isJoiningSpace}
            disabled={isJoiningSpace}
            onClick={joinSpace}
          >
            Join Space
          </PrimaryButton>
        </Box>
      )}

      {walletGateEnabled && !isVerified && (
        <Box mb={2}>
          <WalletSign
            loading={summonGate.isVerifying}
            signSuccess={onWalletSignature}
            buttonStyle={{ width: '100%' }}
          />
        </Box>
      )}
      {walletGateEnabled &&
        tokenGate.tokenGateResult &&
        (!tokenGate.isVerified && !summonGate.isVerified ? (
          <Alert severity='warning' data-test='token-gate-failure-alert'>
            Your wallet does not meet any of the conditions to access this space. You can try with another wallet.
          </Alert>
        ) : (
          <Alert severity='success'>
            You can join this space.{' '}
            {tokenGate.tokenGateResult?.roles.length > 0
              ? 'You will also receive the roles attached to each condition you passed.'
              : ''}
          </Alert>
        ))}

      {noGateConditions && (
        <Alert data-test='token-gate-empty-state' severity='info' sx={{ my: 1 }}>
          No membership conditions were found for this space.
        </Alert>
      )}
    </>
  );
}
