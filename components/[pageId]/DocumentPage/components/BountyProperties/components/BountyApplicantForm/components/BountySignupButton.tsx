import { Box } from '@mui/material';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import { useContext, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import Modal from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import TokenGateForm from 'components/common/TokenGateForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { usePopupState } from 'material-ui-popup-state/hooks';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import charmClient from 'charmClient';

export default function BountySignupButton () {

  const { account } = useWeb3React();
  const { user, setUser } = useUser();
  const [space] = useCurrentSpace();
  const loginViaTokenGateModal = usePopupState({ variant: 'popover', popupId: 'login-via-token-gate' });
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const [loggingIn, setLoggingIn] = useState(false);

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
      <Button color='primary' onClick={loginViaTokenGateModal.open}>
        Join this workspace to apply
      </Button>
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
                  window.location.reload();
                }}
                spaceDomain={space?.domain ?? ''}
              />
            )
        }
      </Modal>
    </>
  );
}
