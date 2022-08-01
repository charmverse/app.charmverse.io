import { Box, Button, Tooltip } from '@mui/material';
import { Application, Bounty } from '@prisma/client';
import { useState } from 'react';
import { useBounties } from 'hooks/useBounties';
import { useUser } from 'hooks/useUser';
import { countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties';
import { useContributors } from 'hooks/useContributors';
import { ApplicationEditorForm } from './components/ApplicationEditorForm';
import SubmissionEditorForm from './components/SubmissionEditorForm';
import SignupButton from './components/BountySignupButton';

interface BountyApplicationFormProps {
  permissions: AssignedBountyPermissions
  bounty: Bounty
  submissions: Application[]
  refreshSubmissions: () => Promise<void>
}

export default function BountyApplicantForm (props: BountyApplicationFormProps) {
  const { refreshSubmissions, bounty, permissions, submissions } = props;
  const validSubmissionsCount = countValidSubmissions(submissions);
  const { refreshBounty } = useBounties();
  const [contributors] = useContributors();
  const [user,, isUserLoaded] = useUser();
  const [showApplication, setShowApplication] = useState(false);

  // Only applies if there is a submissions cap
  const capReached = bounty.maxSubmissions !== null && (validSubmissionsCount >= bounty.maxSubmissions);
  const canCreateSubmission = !bounty.submissionsLocked
    && !capReached
    && permissions?.userPermissions.work
    && bounty.createdBy !== user?.id;
  const newSubmissionTooltip = bounty.submissionsLocked
    ? 'Submissions locked'
    : !permissions?.userPermissions.work
      ? 'You do not have the correct role to submit work to this bounty'
      : (capReached ? 'The submissions cap has been reached. This bounty is closed to new submissions.' : '');

  const isSpaceMember = Boolean(user && contributors.some(c => c.id === user.id));
  const showSignup = isUserLoaded && (!user || !isSpaceMember);

  if (showSignup) {
    return (
      <Box display='flex' justifyContent='center' my={3}>
        <Tooltip placement='top' title='Verify your wallet' arrow>
          <SignupButton />
        </Tooltip>
      </Box>
    );
  }

  if (!showApplication && bounty.createdBy !== user?.id && !permissions.userPermissions.review) {
    return (
      <Box display='flex' justifyContent='center' my={3}>
        <Tooltip placement='top' title={newSubmissionTooltip} arrow>
          <span>
            <Button
              disabled={!canCreateSubmission}
              onClick={() => {
                setShowApplication(true);
              }}
            >
              Apply to this bounty
            </Button>
          </span>
        </Tooltip>
      </Box>
    );
  }
  else if (showApplication) {
    if (bounty.approveSubmitters) {
      return (
        <ApplicationEditorForm
          bountyId={bounty.id}
          mode='create'
          onSubmit={() => {
            setShowApplication(false);
          }}
          onCancel={() => {
            setShowApplication(false);
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
          setShowApplication(false);
        }}
        permissions={permissions}
      />
    );
  }
  return null;
}
