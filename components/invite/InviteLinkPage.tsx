import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useRouter } from 'next/router';
import { useContext } from 'react';

import charmClient from 'charmClient';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import PrimaryButton from 'components/common/PrimaryButton';
import { WalletSign } from 'components/login/WalletSign';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { InviteLinkPopulated } from 'lib/invites';

import { CenteredBox } from './components/CenteredBox';

export default function InvitationPage({ invite }: { invite: InviteLinkPopulated }) {
  const { user } = useUser();
  const { connectWallet, walletAuthSignature, verifiableWalletDetected } = useWeb3AuthSig();
  const { loginFromWeb3Account } = useUser();
  const { showOnboarding } = useOnboarding();
  const router = useRouter();

  async function joinSpace() {
    if (!user && verifiableWalletDetected && walletAuthSignature) {
      await charmClient.createUser({ address: walletAuthSignature.address, walletSignature: walletAuthSignature });
    }
    await charmClient.acceptInvite({ id: invite.id });
    window.location.href = `/${invite.space.domain}`;
    showOnboarding(invite.space.id);
  }

  return (
    <CenteredBox>
      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box mb={3}>
          <WorkspaceAvatar image={invite.space.spaceImage} name={invite.space.name} variant='rounded' />
        </Box>
        <Box display='flex' flexDirection='column' alignItems='center' mb={3}>
          <Typography gutterBottom>You've been invited to join</Typography>
          <Typography variant='h5'>{invite.space.name}</Typography>
        </Box>
        {user ? (
          <PrimaryButton data-test='accept-invite-button' fullWidth size='large' onClick={joinSpace}>
            Accept Invite
          </PrimaryButton>
        ) : (
          <Box display='flex' gap={2}>
            <WalletSign signSuccess={loginFromWeb3Account} />
            <PrimaryButton
              size='large'
              variant='outlined'
              href={`/api/discord/oauth?redirect=${encodeURIComponent(router.asPath.split('?')[0])}&type=login`}
            >
              Connect Discord
            </PrimaryButton>
          </Box>
        )}
      </Card>
    </CenteredBox>
  );
}
