import { log } from '@charmverse/core/log';
import type { InviteLink, Space } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import { useState } from 'react';

import charmClient from 'charmClient';
import PrimaryButton from 'components/common/PrimaryButton';
import { SpaceBanModal } from 'components/common/SpaceAccessGate/SpaceBanModal';
import { LoginButton } from 'components/login/components/LoginButton';
import WorkspaceAvatar from 'components/settings/space/components/LargeAvatar';
import { useSnackbar } from 'hooks/useSnackbar';
import { useUser } from 'hooks/useUser';
import { getSpaceUrl } from '@packages/lib/utils/browser';

import { CenteredBox } from './components/CenteredBox';

export type Props = {
  invite: Pick<InviteLink, 'id' | 'visibleOn'>;
  space: Pick<Space, 'id' | 'customDomain' | 'domain' | 'spaceImage' | 'name'>;
};

export default function InvitationPage({ invite, space }: Props) {
  const { user } = useUser();
  const { showMessage } = useSnackbar();
  const [isBannedFromSpace, setIsBannedFromSpace] = useState(false);
  async function joinSpace() {
    try {
      if (space.domain === 'op-grants' && user) {
        charmClient.track.trackActionOp('click_signup', {
          signinMethod: user.identityType
        });
      }
      await charmClient.acceptInvite({ id: invite.id });

      let redirectUrl = getSpaceUrl(space);

      if (invite.visibleOn) {
        redirectUrl += '/proposals';
      }

      window.location.href = redirectUrl;
    } catch (error: any) {
      if (error.status === 401 && error.message?.includes('banned')) {
        setIsBannedFromSpace(true);
      } else {
        showMessage(error.message, 'error');
      }
      log.error('Error accepting invite', {
        inviteId: invite.id,
        spaceId: space.id,
        userId: user?.id,
        error
      });
    }
  }
  return (
    <CenteredBox>
      <SpaceBanModal
        onClose={() => {
          setIsBannedFromSpace(false);
        }}
        open={isBannedFromSpace}
      />
      <Card sx={{ p: 3, display: 'flex', alignItems: 'center', flexDirection: 'column' }}>
        <Box mb={3}>
          <WorkspaceAvatar image={space.spaceImage} name={space.name} variant='rounded' />
        </Box>
        <Box display='flex' flexDirection='column' alignItems='center' mb={3}>
          <Typography gutterBottom>You've been invited to join</Typography>
          <Typography variant='h5'>{space.name}</Typography>
        </Box>
        {user ? (
          <PrimaryButton
            data-test='accept-invite-button'
            disabled={isBannedFromSpace}
            fullWidth
            size='large'
            onClick={joinSpace}
          >
            Accept Invite
          </PrimaryButton>
        ) : (
          <LoginButton showSignup redirectUrl={typeof window !== 'undefined' ? window.location.pathname : ''} />
        )}
      </Card>
    </CenteredBox>
  );
}
