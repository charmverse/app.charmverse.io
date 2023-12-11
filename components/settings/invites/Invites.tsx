import type { Space } from '@charmverse/core/prisma';
import { Box, Typography } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useContext, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';

import { useTrackPageView } from 'charmClient/hooks/track';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import Loader from 'components/common/Loader';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSpaceInvitesList } from 'hooks/useSpaceInvitesList';
import { useWeb3Account } from 'hooks/useWeb3Account';

import Legend from '../Legend';

import { InviteLinkList } from './components/InviteLinks';
import InviteActions from './components/InviteLinks/components/InviteActions';
import InviteIntro from './components/InviteLinks/components/InviteIntro';
import { PublicInvitesList } from './components/PublicInvitesList';
import { TokenGates } from './components/TokenGates';

export function Invites({ space }: { space: Space }) {
  const isAdmin = useIsAdmin();
  const popupInvitesState = usePopupState({ variant: 'popover', popupId: 'invites' });
  const popupTokenGateState = usePopupState({ variant: 'popover', popupId: 'token-gate' });

  const isOpeningTokenGate = useRef(false);

  const { connectWallet } = useContext(Web3Connection);
  const { account } = useWeb3Account();
  const { isConnected } = useAccount();

  const { publicInvites, isLoadingInvites } = useSpaceInvitesList();
  useTrackPageView({ type: 'settings/invites' });
  function handleTokenGate() {
    if (account || isConnected) {
      popupTokenGateState.open();
    } else {
      isOpeningTokenGate.current = true;
      connectWallet();
    }
  }

  useEffect(() => {
    if (account && isOpeningTokenGate.current) {
      popupTokenGateState.open();
      isOpeningTokenGate.current = false;
    }
  }, [account, isConnected]);

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
          onOpenTokenGateClick={handleTokenGate}
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
