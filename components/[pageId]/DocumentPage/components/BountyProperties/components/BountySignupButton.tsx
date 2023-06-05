import type { PageMeta } from '@charmverse/core/pages';
import { Box } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import { SpaceAccessGate } from 'components/common/SpaceAccessGate/SpaceAccessGate';
import { WalletSign } from 'components/login/WalletSign';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useIsSpaceMember } from 'hooks/useIsSpaceMember';
import { useUser } from 'hooks/useUser';
import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';
import { lowerCaseEqual } from 'lib/utilities/strings';

interface Props {
  pagePath: string;
}

export function BountySignupButton({ pagePath }: Props) {
  const { account, walletAuthSignature, loginFromWeb3Account } = useWeb3AuthSig();
  const { user, setUser, isLoaded: isUserLoaded } = useUser();
  const space = useCurrentSpace();
  const { data: spaceWithGates } = useSWR(space ? `spaceByDomain/${space.domain}` : null, () =>
    charmClient.spaces.searchByDomain(space!.domain)
  );
  const loginViaTokenGateModal = usePopupState({ variant: 'popover', popupId: 'login-via-token-gate' });
  const [loggingIn, setLoggingIn] = useState(false);

  const { isSpaceMember } = useIsSpaceMember();
  const showSignup = isUserLoaded && (!user || !isSpaceMember);

  function loginUser() {
    if (
      !loggingIn &&
      account &&
      walletAuthSignature &&
      lowerCaseEqual(walletAuthSignature?.address as string, account as string)
    ) {
      setLoggingIn(true);
      charmClient
        .login({ address: account as string, walletSignature: walletAuthSignature })
        .then((loggedInProfile) => {
          setUser(loggedInProfile);
          setLoggingIn(false);
        });
    }
  }

  useEffect(() => {
    if (account && !user) {
      loginUser();
    }
  }, [account]);

  return (
    <>
      <Box display='flex' justifyContent='center' sx={{ my: 2 }} data-test='public-bounty-space-action'>
        {showSignup && (
          <Button color='primary' onClick={loginViaTokenGateModal.open}>
            Join this space to apply
          </Button>
        )}
      </Box>

      <Modal
        size='large'
        open={loginViaTokenGateModal.isOpen}
        onClose={loginViaTokenGateModal.close}
        title={`Join the ${space?.name} space to apply`}
      >
        {!account ? (
          <Box display='flex' justifyContent='center' sx={{ mt: 3 }}>
            <WalletSign signSuccess={loginFromWeb3Account} />
          </Box>
        ) : (
          spaceWithGates && (
            <SpaceAccessGate
              onSuccess={() => {
                window.location.href = `${window.location.origin}/${space?.domain}/${pagePath}`;
              }}
              space={spaceWithGates}
              joinType='public_bounty_token_gate'
            />
          )
        )}
      </Modal>
    </>
  );
}
