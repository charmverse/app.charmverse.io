import type { Space } from '@charmverse/core/prisma';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePopupState } from 'material-ui-popup-state/hooks';

import { useTrackPageView } from 'charmClient/hooks/track';
import Loader from 'components/common/Loader';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';

import Legend from '../components/Legend';

import { InviteLinkList } from './components/InviteLinks';
import InviteActions from './components/InviteLinks/components/InviteActions';
import InviteIntro from './components/InviteLinks/components/InviteIntro';
import { PublicInvitesList } from './components/PublicInvitesList';
import { TokenGates } from './components/TokenGates';

export function Invites({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const popupInvitesState = usePopupState({ variant: 'popover', popupId: 'invites' });
  const popupTokenGateState = usePopupState({ variant: 'popover', popupId: 'token-gate' });

  const { publicInvites, isLoadingInvites } = useSpaceInvitesList();
  useTrackPageView({ type: 'settings/invites' });

  return (
    <>
      <Box mb={2}>
        <InviteIntro />
      </Box>
      <Legend
        noBorder
        variant='inherit'
        variantMapping={{ inherit: 'div' }}
        display='flex'
        justifyContent='space-between'
      >
        <Typography variant='h2' fontSize='inherit' fontWeight={700}>
          Invite Links
        </Typography>
        <InviteActions
          onOpenInvitesClick={popupInvitesState.open}
          onOpenTokenGateClick={popupTokenGateState.open}
          isAdmin={isAdmin}
        />
      </Legend>
      {isLoadingInvites ? <Loader size={20} /> : <InviteLinkList popupState={popupInvitesState} />}
      <Box sx={{ my: 2 }} />
      {publicInvites && publicInvites.length > 0 && (
        <>
          <PublicInvitesList />
          <Box sx={{ my: 2 }} />
        </>
      )}
      <TokenGates isAdmin={isAdmin} space={space} popupState={popupTokenGateState} />
    </>
  );
}
