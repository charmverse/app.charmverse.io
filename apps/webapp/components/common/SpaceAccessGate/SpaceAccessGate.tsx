import type { Space } from '@charmverse/core/prisma-client';
import { Alert, Box, Divider, Typography } from '@mui/material';
import type { PageContent } from '@packages/charmeditor/interfaces';
import { Editor } from '@packages/charmeditor/ui';
import type { TokenGateJoinType } from '@packages/lib/tokenGates/interfaces';
import { getSpaceUrl } from '@packages/lib/utils/browser';
import { useRouter } from 'next/router';
import { useState } from 'react';

import PrimaryButton from 'components/common/PrimaryButton';
import { LoginButton } from 'components/login/components/LoginButton';
import WorkspaceAvatar from 'components/settings/space/components/LargeAvatar';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';

import { useTokenGates } from './components/TokenGate/hooks/useTokenGates';
import { TokenGate } from './components/TokenGate/TokenGate';
import { SpaceBanModal } from './SpaceBanModal';

export function SpaceAccessGate({
  space,
  onSuccess,
  joinType
}: {
  space: Space;
  joinType?: TokenGateJoinType;
  onSuccess?: () => void;
}) {
  const [isBannedFromSpace, setIsBannedFromSpace] = useState(false);

  const router = useRouter();
  const { showMessage } = useSnackbar();
  const { user } = useUser();
  const { account, loginFromWeb3Account } = useWeb3Account();

  const tokenGate = useTokenGates({
    account,
    autoVerify: true,
    joinType,
    space,
    onSuccess: onJoinSpace
  });

  function onJoinSpace() {
    if (onSuccess) {
      onSuccess();
    } else {
      const spaceUrl = getSpaceUrl(space);
      router.push(spaceUrl);
    }
  }

  async function evaluateUserWallet() {
    if (!user) {
      try {
        await loginFromWeb3Account();
      } catch (err: any) {
        showMessage(err?.message ?? 'An unknown error occurred', err?.severity ?? 'error');
        return;
      }
    }
    await tokenGate.evaluateEligibility();
  }

  function onError(error: any) {
    if (error.status === 401 && error.message?.includes('banned')) {
      setIsBannedFromSpace(true);
    } else {
      showMessage(error?.message ?? error ?? 'An unknown error occurred', 'error');
    }
  }

  function joinSpace() {
    if (tokenGate.isVerified) {
      tokenGate.joinSpace(onError);
    } else {
      showMessage('You are not eligible to join this space', 'error');
    }
  }

  const walletGateEnabled = tokenGate.isEnabled;
  const isVerified = tokenGate.isVerified;
  const isVerifying = tokenGate.isVerifying;
  const isJoiningSpace = tokenGate.joiningSpace;

  const noGateConditions = !tokenGate.isEnabled && tokenGate.tokenGates?.length === 0;

  const hasRoles = tokenGate.tokenGateResult?.eligibleGates.some((id) =>
    tokenGate.tokenGates?.find((tk) => {
      return tk.id === id && tk.tokenGateToRoles.length > 0;
    })
  );

  return (
    <Box display='flex' flexDirection='column' gap={2}>
      <SpaceBanModal
        onClose={() => {
          setIsBannedFromSpace(false);
        }}
        open={isBannedFromSpace}
      />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box mb={3}>
          <WorkspaceAvatar image={space.spaceImage} name={space.name} variant='rounded' />
        </Box>
        <Typography variant='h5' gutterBottom>
          {space.name}
        </Typography>
        {space.tokenGateMessage && (
          <Editor
            extensionGroup='tokengate_message'
            readOnly
            component={Box}
            style={{ width: '100%', textAlign: 'center' }}
            defaultValue={space.tokenGateMessage as PageContent}
          />
        )}
      </Box>
      <Divider />
      {walletGateEnabled && (
        <Typography variant='body2' align='center'>
          The following criteria must be met to join:
        </Typography>
      )}

      {tokenGate.isEnabled && (
        <TokenGate {...tokenGate} tokenGates={tokenGate.tokenGates?.filter((tk) => !tk.archived) ?? null} />
      )}

      {walletGateEnabled &&
        tokenGate.tokenGateResult &&
        (!tokenGate.isVerified ? (
          <Alert severity='warning' data-test='token-gate-failure-alert'>
            Your wallet does not meet any of the conditions to access this space. You can try with another wallet.
          </Alert>
        ) : (
          <Alert severity='success'>
            You can join this space.{' '}
            {hasRoles ? 'You will also receive the roles attached to each condition you passed.' : ''}
          </Alert>
        ))}

      {noGateConditions && (
        <Alert data-test='token-gate-empty-state' severity='info' sx={{ mt: 1, mb: 2 }}>
          No membership conditions were found for this space.
        </Alert>
      )}

      {isVerified && (
        <Box mb={2}>
          <PrimaryButton
            data-test='join-space-button'
            fullWidth
            loading={isJoiningSpace}
            disabled={isJoiningSpace}
            onClick={joinSpace}
          >
            Join
          </PrimaryButton>
        </Box>
      )}
      {!user && (
        <Box sx={{ '.MuiButton-root': { width: '100%' } }}>
          <LoginButton showSignup={false} signInLabel='Connect your wallet' />
        </Box>
      )}
      {walletGateEnabled && !isVerified && !!user && (
        <Box mb={2}>
          <PrimaryButton
            fullWidth
            loading={isVerifying}
            disabled={isVerifying}
            onClick={evaluateUserWallet}
            data-test='verify-token-gate-btn'
          >
            Verify
          </PrimaryButton>
        </Box>
      )}
    </Box>
  );
}
