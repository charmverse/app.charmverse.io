import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import charmClient from 'charmClient';
import PrimaryButton from 'components/common/PrimaryButton';
import { Login } from 'components/login/Login';
import WorkspaceAvatar from 'components/settings/workspace/LargeAvatar';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import type { InviteLinkPopulated } from 'lib/invites';

import { CenteredBox } from './components/CenteredBox';

export default function InvitationPage({ invite }: { invite: InviteLinkPopulated }) {
  const { user } = useUser();
  const { walletAuthSignature, verifiableWalletDetected } = useWeb3AuthSig();

  async function joinSpace() {
    if (!user && verifiableWalletDetected && walletAuthSignature) {
      await charmClient.createUser({ address: walletAuthSignature.address, walletSignature: walletAuthSignature });
    }
    await charmClient.acceptInvite({ id: invite.id });
    window.location.href = `/${invite.space.domain}`;
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
          <Login redirectUrl={typeof window !== 'undefined' ? window.location.pathname : ''} />
        )}
      </Card>
    </CenteredBox>
  );
}
