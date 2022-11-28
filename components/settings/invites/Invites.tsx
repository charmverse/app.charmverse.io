import { Typography } from '@mui/material';
import type { Space } from '@prisma/client';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useContext, useRef } from 'react';

import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import useIsAdmin from 'hooks/useIsAdmin';
import { usePendingLocalAction } from 'hooks/usePendingLocalAction';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

import Legend from '../Legend';

import InviteLinkList from './components/InviteLinks';
import InviteActions from './components/InviteLinks/components/InviteActions';
import InviteIntro from './components/InviteLinks/components/InviteIntro';
import TokenGates from './components/TokenGates';

interface InvitesProps {
  space: Space;
}

function Invites({ space }: InvitesProps) {
  const spaceId = space.id;
  const isAdmin = useIsAdmin();
  const popupInvitesState = usePopupState({ variant: 'popover', popupId: 'invites' });
  const popupTokenGateState = usePopupState({ variant: 'popover', popupId: 'token-gate' });
  const { isPendingAction, setPendingAction } = usePendingLocalAction('open-token-gate-modal');
  const isTokenGatePending = useRef(false);
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const { account } = useWeb3AuthSig();

  if (account && isTokenGatePending.current) {
    setPendingAction();
    isTokenGatePending.current = false;
  }

  function handleTokenGate() {
    if (account) {
      popupTokenGateState.open();
    } else {
      isTokenGatePending.current = true;
      openWalletSelectorModal();
    }
  }

  useEffect(() => {
    if (account && isPendingAction) {
      popupTokenGateState.open();
      isTokenGatePending.current = false;
    }
  }, [account, isPendingAction]);

  return (
    <>
      <InviteIntro />
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
          onOpenTokenGateClick={handleTokenGate}
          invitePopupState={popupInvitesState}
          tokenGatePopupState={popupTokenGateState}
          isAdmin={isAdmin}
        />
      </Legend>
      <InviteLinkList isAdmin={isAdmin} spaceId={spaceId} popupState={popupInvitesState} />
      <TokenGates isAdmin={isAdmin} spaceId={spaceId} popupState={popupTokenGateState} />
    </>
  );
}

export default Invites;
