import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import charmClient from 'charmClient';
import PrimaryButton from 'components/common/PrimaryButton';
import { LoginButton } from 'components/login/components/LoginButton';
import WorkspaceAvatar from 'components/settings/space/components/LargeAvatar';
import { useUser } from 'hooks/useUser';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { InviteLinkPopulated } from 'lib/invites/getInviteLink';
import { getSpaceUrl } from 'lib/utilities/browser';

import { CenteredBox } from './components/CenteredBox';

export default function InvitationPage({ invite }: { invite: InviteLinkPopulated }) {
  const { user } = useUser();
  const { walletAuthSignature, verifiableWalletDetected } = useWeb3Account();

  async function joinSpace() {
    if (!user && verifiableWalletDetected && walletAuthSignature) {
      await charmClient.createUser({ address: walletAuthSignature.address, walletSignature: walletAuthSignature });
    }
    await charmClient.acceptInvite({ id: invite.id });

    let redirectUrl = getSpaceUrl(invite.space);

    if (invite.visibleOn) {
      redirectUrl += '/proposals';
    }

    window.location.href = redirectUrl;
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
          <LoginButton showSignup redirectUrl={typeof window !== 'undefined' ? window.location.pathname : ''} />
        )}
      </Card>
    </CenteredBox>
  );
}
