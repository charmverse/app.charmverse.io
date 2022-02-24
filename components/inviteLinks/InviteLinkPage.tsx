import { useContext } from 'react';
import styled from '@emotion/styled';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useWeb3React } from '@web3-react/core';
import WorkspaceAvatar from 'components/settings/LargeAvatar';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { InviteLinkPopulated } from 'lib/invites';
import PrimaryButton from 'components/common/PrimaryButton';
import { useUser } from 'hooks/useUser';
import charmClient from 'charmClient';

const CenteredBox = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  max-width: 100%;
`;

export default function InvitationPage ({ error, invite }: { error?: string, invite?: InviteLinkPopulated }) {

  const [user] = useUser();
  const { account } = useWeb3React();
  const { openWalletSelectorModal, triedEager } = useContext(Web3Connection);

  async function joinSpace () {
    if (!user) {
      await charmClient.createUser({ address: account! });
    }
    await charmClient.acceptInvite({ id: invite!.id });
    window.location.href = `/${invite!.space.domain}`;
  }

  if (error) {
    return (
      <CenteredBox>
        <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
          <Box display='flex' flexDirection='column' alignItems='center' mb={3}>
            <Typography variant='h5' gutterBottom><strong>Invite Invalid</strong></Typography>
            <Typography align='center' color='danger'>This invite may be expired, or you might not have permission to join.</Typography>
          </Box>
          <PrimaryButton fullWidth size='large' href='/'>
            Continue to CharmVerse
          </PrimaryButton>
        </Card>
      </CenteredBox>
    );
  }
  return (
    <CenteredBox>
      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box mb={3}>
          <WorkspaceAvatar name={invite!.space.name} variant='rounded' />
        </Box>
        <Box display='flex' flexDirection='column' alignItems='center' mb={3}>
          <Typography gutterBottom>You've been invited to join</Typography>
          <Typography variant='h5'>{invite!.space.name}</Typography>
        </Box>
        {account ? (
          <PrimaryButton fullWidth size='large' onClick={joinSpace}>
            Accept Invite
          </PrimaryButton>
        ) : (
          <PrimaryButton fullWidth size='large' loading={!triedEager} onClick={openWalletSelectorModal}>
            Connect Wallet
          </PrimaryButton>
        )}
      </Card>
    </CenteredBox>
  );
}
