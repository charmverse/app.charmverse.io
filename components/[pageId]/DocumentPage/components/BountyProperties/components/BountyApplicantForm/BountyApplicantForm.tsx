import { Box, Button, Stack, Tooltip } from '@mui/material';
import type { Application, Bounty } from '@prisma/client';
import { useState } from 'react';

import { useBounties } from 'hooks/useBounties';
import { useUser } from 'hooks/useUser';
import { submissionsCapReached } from 'lib/applications/shared';
import type { AssignedBountyPermissions } from 'lib/bounties';

import { ApplicationComments } from '../BountyApplicantsTable/ApplicationComments';

import ApplicationInput from './components/ApplicationInput';
import SubmissionInput from './components/SubmissionInput';

interface BountyApplicationFormProps {
  permissions: AssignedBountyPermissions;
  bounty: Bounty;
  submissions: Application[];
  refreshSubmissions: () => void;
}

export default function BountyApplicantForm(props: BountyApplicationFormProps) {
  const { refreshSubmissions, bounty, permissions, submissions } = props;
  const { refreshBounty } = useBounties();
  const { user } = useUser();
  const [showApplication, setShowApplication] = useState(false);
  const userApplication = submissions.find((s) => s.createdBy === user?.id);

  // Only applies if there is a submissions cap
  const capReached = submissionsCapReached({
    bounty,
    submissions
  });

  const canCreateApplication =
    !userApplication && !bounty.submissionsLocked && !capReached && permissions?.userPermissions.work;

  const newSubmissionTooltip = bounty.submissionsLocked
    ? 'Submissions locked'
    : !permissions?.userPermissions.work
    ? 'You do not have the correct role to work on this bounty'
    : capReached
    ? 'The submissions cap has been reached. This bounty is closed to new submissions.'
    : '';

  async function submitApplication() {
    setShowApplication(false);
    await refreshSubmissions();
    await refreshBounty(bounty.id);
  }

  if (!userApplication && bounty.approveSubmitters) {
    return !showApplication ? (
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
      <ApplicationInput
        permissions={permissions}
        refreshSubmissions={refreshSubmissions}
        bountyId={bounty.id}
        mode='create'
        onSubmit={submitApplication}
        onCancel={() => {
          setShowApplication(false);
        }}
      />
    );
    // Submissions cap exists and user has applied
  } else if (userApplication && bounty.approveSubmitters) {
    return (
      <>
        <ApplicationInput
          permissions={permissions}
          refreshSubmissions={refreshSubmissions}
          bountyId={bounty.id}
          application={userApplication}
          mode='update'
          readOnly={userApplication?.status !== 'applied'}
          onSubmit={() => {
            setShowApplication(false);
          }}
        />
        {userApplication?.status !== 'applied' && (
          <SubmissionInput
            hasCustomReward={bounty.customReward !== null}
            bountyId={bounty.id}
            onSubmit={submitApplication}
            submission={userApplication}
            permissions={permissions}
            expandedOnLoad={true}
            onCancel={() => {
              setShowApplication(false);
            }}
            readOnly={userApplication?.status !== 'inProgress' && userApplication?.status !== 'review'}
            alwaysExpanded
          />
        )}
        {userApplication && userApplication.createdBy === user?.id && (
          <Stack gap={1} mt={2}>
            <ApplicationComments status={userApplication.status} applicationId={userApplication.id} />
          </Stack>
        )}
      </>
    );
    // When we don't need to apply
  } else if (!bounty.approveSubmitters) {
    return !showApplication && !userApplication ? (
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
      <SubmissionInput
        bountyId={bounty.id}
        onSubmit={submitApplication}
        onCancel={() => {
          setShowApplication(false);
        }}
        hasCustomReward={bounty.customReward !== null}
        readOnly={userApplication?.status === 'rejected'}
        submission={userApplication}
        permissions={permissions}
        alwaysExpanded
      />
    );
  } else {
    return null;
  }
}
