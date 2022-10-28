import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useContext } from 'react';

import charmClient from 'charmClient';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import PrimaryButton from 'components/common/PrimaryButton';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';
import { useOnboarding } from 'hooks/useOnboarding';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { InviteLinkPopulated } from 'lib/invites';

import { CenteredBox } from './components/CenteredBox';

export default function InvitationPage ({ invite }: { invite: InviteLinkPopulated }) {

  const { user } = useUser();
  const { openWalletSelectorModal, triedEager } = useContext(Web3Connection);
  const { account, walletAuthSignature } = useWeb3AuthSig();
  const { showOnboarding } = useOnboarding();

  async function joinSpace () {
    if (!user && account && walletAuthSignature) {
      await charmClient.createUser({ address: account, walletSignature: walletAuthSignature });
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
        {(account || user) ? (
          <PrimaryButton data-test='accept-invite-button' fullWidth size='large' onClick={joinSpace}>
            Accept Invite
          </PrimaryButton>
        ) : (
          <Box display='flex' gap={2}>
            <PrimaryButton size='large' loading={!triedEager} onClick={openWalletSelectorModal}>
              Connect Wallet
            </PrimaryButton>
            <PrimaryButton size='large' href={`/api/discord/oauth?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=login`}>
              Connect Discord
            </PrimaryButton>
          </Box>
        )}
      </Card>
    </CenteredBox>
  );
}
