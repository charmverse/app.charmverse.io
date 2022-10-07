import Typography from '@mui/material/Typography';
import type { Space } from '@prisma/client';
import { bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import useIsAdmin from 'hooks/useIsAdmin';

import Legend from '../Legend';

import InviteLinkList from './components/InviteLinks';
import InviteActions from './components/InviteLinks/components/InviteActions';
import InviteIntro from './components/InviteLinks/components/InviteIntro';
import TokenGates from './components/TokenGates';

interface InvitesProps {
  space: Space;
}

function Invites ({ space }: InvitesProps) {
  const spaceId = space.id;
  const isAdmin = useIsAdmin();
  const popupInvitesState = usePopupState({ variant: 'popover', popupId: 'invites' });
  const popupTokenGateState = usePopupState({ variant: 'popover', popupId: 'token-gate' });

  return (
    <>
      <InviteIntro />
      <Legend noBorder variant='inherit' variantMapping={{ inherit: 'div' }} display='flex' justifyContent='space-between'>
        <Typography variant='h2' fontSize='inherit' fontWeight={700}>Invite Links</Typography>
        <InviteActions openInvites={bindTrigger(popupInvitesState)} openTokenGate={bindTrigger(popupTokenGateState)} isAdmin={isAdmin} />
      </Legend>
      <InviteLinkList isAdmin={isAdmin} spaceId={spaceId} popupState={popupInvitesState} />
      <TokenGates isAdmin={isAdmin} spaceId={spaceId} popupState={popupTokenGateState} />
    </>
  );
}

export default Invites;
