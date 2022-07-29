import { Box, Button, Stack, Tooltip } from '@mui/material';
import { Application, Bounty } from '@prisma/client';
import { useBounties } from 'hooks/useBounties';
import { useUser } from 'hooks/useUser';
import { countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties';
import { useContext, useEffect, useState } from 'react';
import { useWeb3React } from '@web3-react/core';
import Modal from 'components/common/Modal';
import PrimaryButton from 'components/common/PrimaryButton';
import TokenGateForm from 'components/common/TokenGateForm';
import { useCurrentSpace } from 'hooks/useCurrentSpace';

import { usePopupState } from 'material-ui-popup-state/hooks';
import { Web3Connection } from 'components/_app/Web3ConnectionManager';
import { useContributors } from 'hooks/useContributors';
import charmClient from 'charmClient';
import { ApplicationEditorForm } from '../[bountyId]/components/ApplicationEditorForm';
import SubmissionEditorForm from '../[bountyId]/components_v3/SubmissionEditorForm';

interface BountyApplicationFormProps {
  permissions: AssignedBountyPermissions
  bounty: Bounty
  submissions: Application[]
  refreshSubmissions: () => Promise<void>
}

export default function BountyApplicationForm (props: BountyApplicationFormProps) {
  const { refreshSubmissions, bounty, permissions, submissions } = props;
  const validSubmissionsCount = countValidSubmissions(submissions);
  const [contributors] = useContributors();
  const [space] = useCurrentSpace();
  const { refreshBounty } = useBounties();
  const loginViaTokenGateModal = usePopupState({ variant: 'popover', popupId: 'login-via-token-gate' });
  const { account } = useWeb3React();
  const [user, setUser] = useUser();
  const { openWalletSelectorModal } = useContext(Web3Connection);
  const [isApplyingBounty, setIsApplyingBounty] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  const isSpaceMember = user && contributors.some(c => c.id === user.id);

  const userSubmission = submissions.find(sub => sub.createdBy === user?.id);
  // Only applies if there is a submissions cap
  const capReached = bounty.maxSubmissions !== null && (validSubmissionsCount >= bounty.maxSubmissions);
  const canCreateSubmission = !bounty.submissionsLocked
    && !userSubmission
    && !capReached
    && permissions?.userPermissions.work
    && bounty.createdBy !== user?.id;
  const newSubmissionTooltip = bounty.submissionsLocked ? 'Submissions locked' : !permissions?.userPermissions.work ? 'You do not have the correct role to submit work to this bounty' : (capReached ? 'The submissions cap has been reached. This bounty is closed to new submissions.' : '');

  const showSignup = true;

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

  if (!userSubmission) {
    if (showSignup) {

      return (
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
                  window.location.reload();
                }}
                spaceDomain={space.domain}
              />
            )
          }

        </Modal>
      );
    }
    if (!isApplyingBounty && bounty.createdBy !== user?.id && !permissions.userPermissions.review) {
      return (
        <Tooltip placement='top' title={newSubmissionTooltip} arrow>
          <Stack justifyContent='center' width='100%' flexDirection='row' my={2}>
            <Box component='span'>
              <Button
                disabled={!canCreateSubmission}
                onClick={() => {
                  setIsApplyingBounty(true);
                }}
              >
                Apply to this bounty
              </Button>
            </Box>
          </Stack>
        </Tooltip>
      );
    }
    else if (isApplyingBounty) {
      if (bounty.approveSubmitters) {
        return (
          <ApplicationEditorForm
            bountyId={bounty.id}
            mode='create'
            onSubmit={() => {
              setIsApplyingBounty(false);
            }}
            onCancel={() => {
              setIsApplyingBounty(false);
            }}
            showHeader
          />
        );
      }
      return (
        <SubmissionEditorForm
          bountyId={bounty.id}
          showHeader
          onSubmit={async () => {
            await refreshSubmissions();
            await refreshBounty(bounty.id);
            setIsApplyingBounty(false);
          }}
          permissions={permissions}
        />
      );
    }
  }

  return null;
}
