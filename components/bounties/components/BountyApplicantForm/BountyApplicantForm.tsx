import { Box, Button, Tooltip } from '@mui/material';
import { Application, Bounty } from '@prisma/client';
import { useBounties } from 'hooks/useBounties';
import { useContributors } from 'hooks/useContributors';
import { useUser } from 'hooks/useUser';
import { submissionsCapReached } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties';
import { useState } from 'react';
import { ApplicationEditorForm } from './components/ApplicationEditorForm';
import SignupButton from './components/BountySignupButton';
import SubmissionEditorForm from './components/SubmissionEditorForm';

interface BountyApplicationFormProps {
  permissions: AssignedBountyPermissions
  bounty: Bounty
  submissions: Application[]
  refreshSubmissions: () => Promise<void>
}

export default function BountyApplicantForm (props: BountyApplicationFormProps) {
  const { refreshSubmissions, bounty, permissions, submissions } = props;
  const { refreshBounty } = useBounties();
  const [contributors] = useContributors();
  const [user,, isUserLoaded] = useUser();
  const [showApplication, setShowApplication] = useState(false);
  const userApplication = submissions.find(s => s.createdBy === user?.id);

  // Only applies if there is a submissions cap
  const capReached = submissionsCapReached({
    bounty,
    submissions
  });

  const canCreateApplication = !userApplication && !bounty.submissionsLocked
    && !capReached
    && permissions?.userPermissions.work;

  const newSubmissionTooltip = bounty.submissionsLocked
    ? 'Submissions locked'
    : !permissions?.userPermissions.work
      ? 'You do not have the correct role to work on this bounty'
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

  // Submissions cap exists and user has not applied yet
  }
  else if (!userApplication && bounty.approveSubmitters) {
    return (
      !showApplication ? (
        <Box display='flex' justifyContent='center' my={3}>
          <Tooltip placement='top' title={newSubmissionTooltip} arrow>
            <span>
              <Button
                disabled={!canCreateApplication}
                onClick={() => {
                  setShowApplication(true);
                }}
              >
                Apply to this bounty
              </Button>
            </span>
          </Tooltip>
        </Box>
      ) : (
        <ApplicationEditorForm
          bountyId={bounty.id}
          mode='create'
          onSubmit={() => {
            setShowApplication(false);
          }}
          onCancel={() => {
            setShowApplication(false);
          }}
        />
      )
    );
    // Submissions cap exists and user has applied
  }
  else if (userApplication && bounty.approveSubmitters) {
    return (
      <>
        <ApplicationEditorForm
          bountyId={bounty.id}
          proposal={userApplication}
          mode='update'
          onSubmit={() => {
            setShowApplication(false);
          }}
        />
        { userApplication?.status !== 'applied' && (

          <SubmissionEditorForm
            bountyId={bounty.id}
            onSubmit={async () => {
              await refreshSubmissions();
              await refreshBounty(bounty.id);
              setShowApplication(false);
            }}
            submission={userApplication}
            permissions={permissions}
            expandedOnLoad={true}
            onCancel={() => {
              setShowApplication(false);
            }}
          />
        )}
      </>
    );
    // When we don't need to apply
  }
  else if (!bounty.approveSubmitters) {
    return (
      !showApplication && !userApplication ? (
        <Box display='flex' justifyContent='center' my={3}>
          <Tooltip placement='top' title={newSubmissionTooltip} arrow>
            <span>
              <Button
                disabled={!canCreateApplication}
                onClick={() => {
                  setShowApplication(true);
                }}
              >
                New submission
              </Button>
            </span>
          </Tooltip>
        </Box>
      ) : (
        <SubmissionEditorForm
          bountyId={bounty.id}
          onSubmit={async () => {
            await refreshSubmissions();
            await refreshBounty(bounty.id);
            setShowApplication(false);
          }}
          onCancel={() => {
            setShowApplication(false);
          }}
          submission={userApplication}
          permissions={permissions}
          expandedOnLoad={true}
        />
      )
    );
  }
  else {
    return null;
  }
}
