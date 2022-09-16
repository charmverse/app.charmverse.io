import { Box } from '@mui/material';
import { useWeb3React } from '@web3-react/core';
import Button from 'components/common/Button';
import Modal from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import TokenGateForm from 'components/common/TokenGateForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { useContext, useEffect, useState } from 'react';

import { Page } from '@prisma/client';
import charmClient from 'charmClient';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { useContributors } from 'hooks/useContributors';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useRouter } from 'next/router';

interface Props {
  bountyPage: Page
}

export function BountySignupButton ({ bountyPage }: Props) {

  const { account } = useWeb3React();
  const { user, setUser, isLoaded: isUserLoaded } = useUser();
  const router = useRouter();
  const [contributors] = useContributors();
  const [space] = useCurrentSpace();
  const loginViaTokenGateModal = usePopupState({ variant: 'popover', popupId: 'login-via-token-gate' });
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const [loggingIn, setLoggingIn] = useState(false);

  const isSpaceMember = Boolean(user && contributors.some(c => c.id === user.id));
  const showSignup = isUserLoaded && (!user || !isSpaceMember);
  const showSpaceRedirect = isUserLoaded && isSpaceMember;

  function loginUser () {
    if (!loggingIn) {
      setLoggingIn(true);
      charmClient.login(account as string)
        .then(loggedInProfile => {
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
        {
        showSignup && (
          <Button color='primary' onClick={loginViaTokenGateModal.open}>
            Join this workspace to apply
          </Button>
        )
      }

        {
        showSpaceRedirect && (
          <Button
            color='primary'
            onClick={() => {
              router.push(`/${space?.domain}/${bountyPage.path}`);
            }}
          >
            View this bounty inside the workspace
          </Button>
        )
      }
      </Box>

      <Modal size='large' open={loginViaTokenGateModal.isOpen} onClose={loginViaTokenGateModal.close} title={`Join the ${space?.name} workspace to apply`}>
        {
          !account
            ? (
              <Box display='flex' justifyContent='center' sx={{ mt: 3 }}>

                <PrimaryButton
                  onClick={openWalletSelectorModal}
                  loading={loggingIn}
                >
                  Connect wallet
                </PrimaryButton>
              </Box>
            )
            : (
              <TokenGateForm
                onSuccess={() => {
                  window.location.href = `${window.location.origin}/${space?.domain}/${bountyPage.path}`;
                }}
                spaceDomain={space?.domain ?? ''}
              />
            )
        }
      </Modal>
    </>
  );
}
