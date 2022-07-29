import Box from '@mui/material/Box';
import { Bounty } from '@prisma/client';
import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import BountyList from 'components/bounties/BountyList';
import ErrorPage from 'components/common/errors/ErrorPage';
import LoadingComponent from 'components/common/LoadingComponent';
import Modal from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import TokenGateForm from 'components/common/TokenGateForm';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { useContributors } from 'hooks/useContributors';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { BountyWithDetails } from 'models';
import { useRouter } from 'next/router';
import { useContext, useEffect, useState } from 'react';

export default function PublicBountyList () {
  const router = useRouter();

  const [contributors] = useContributors();
  const [space] = useCurrentSpace();
  const { account } = useWeb3React();
  const [user, setUser] = useUser();

  const [bounties, setBounties] = useState<BountyWithDetails[] | null>(null);

  const [selectedBounty, setSelectedBounty] = useState<Bounty | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);

  const { openWalletSelectorModal } = useContext(Web3Connection);

  const loginViaTokenGateModal = usePopupState({ variant: 'popover', popupId: 'login-via-token-gate' });

  const isSpaceMember = user && contributors.some(c => c.id === user.id);

  function onSelectBounty (bounty: Bounty) {

    if (isSpaceMember) {
      // We pass the bounty as the useState setter will not have set the new bounty state before calling redirect to space
      redirectToSpace(bounty);
    }
    else {
      setSelectedBounty(bounty);
      loginViaTokenGateModal.open();
    }

  }

  useEffect(() => {
    if (account && !user) {

      loginUser();
    }
    else if (account && user && selectedBounty && isSpaceMember) {
      // Will send the user to the bounty they clicked
      redirectToSpace();
    }
  }, [account]);

  useEffect(() => {
    if (space) {
      charmClient.listBounties(space.id, true)
        .then(_bounties => {
          setBounties(_bounties);
        });
    }

  }, [space]);

  function redirectToSpace (bounty: Bounty | null = selectedBounty) {

    const redirectUrl = bounty ? `/${space?.domain}/bounties/${bounty.id}` : `/${space?.domain}/bounties`;

    router.push(redirectUrl);

  }

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

  if (!space || !bounties) {
    return <LoadingComponent height='200px' isLoading={true} />;
  }

  return (space.publicBountyBoard ? (
    <>
      <BountyList publicMode onSelectBounty={onSelectBounty} bounties={bounties} />
      <Modal size='large' open={loginViaTokenGateModal.isOpen && !isSpaceMember} onClose={loginViaTokenGateModal.close} title={`Join the ${space?.name} workspace to apply`}>
        {
          !account && (
            <Box display='flex' justifyContent='center' sx={{ mt: 3 }}>

              <PrimaryButton
                onClick={openWalletSelectorModal}
                loading={loggingIn}
              >
                Connect wallet
              </PrimaryButton>
            </Box>
          )
        }

        {
          account && space && (
            <TokenGateForm
              onSuccess={() => {
                loginViaTokenGateModal.close();
                // Wait for 2 seconds before redirecting
                setTimeout(() => {
                  redirectToSpace();
                }, 2000);

              }}
              spaceDomain={space.domain}
            />
          )
        }

      </Modal>
    </>
  ) : <ErrorPage message={"Sorry, this workspace's bounties are reserved to its members."} />);
}
