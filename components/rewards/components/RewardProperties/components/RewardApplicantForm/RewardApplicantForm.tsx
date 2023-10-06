import type { UserPermissionFlags } from '@charmverse/core/dist/cjs/permissions';
import type { Application, Bounty, BountyOperation } from '@charmverse/core/prisma';
import { Box, Button, Divider, Stack, Tooltip } from '@mui/material';
import { useState } from 'react';

import { useRewards } from 'components/rewards/hooks/useRewards';
import { useBounties } from 'hooks/useBounties';
import { useUser } from 'hooks/useUser';
import { submissionsCapReached } from 'lib/applications/shared';
import type { AssignedBountyPermissions } from 'lib/bounties';
import type { RewardWithUsers } from 'lib/rewards/interfaces';

import { ApplicationComments } from '../RewardApplicantsTable/ApplicationComments';

import ApplicationInput from './components/ApplicationInput';
import { SubmissionInput } from './components/SubmissionInput';

interface RewardApplicationFormProps {
  permissions: UserPermissionFlags<BountyOperation>;
  reward: RewardWithUsers;
  submissions: Application[];
  refreshSubmissions: () => void;
}

export function RewardApplicantForm(props: RewardApplicationFormProps) {
  const { refreshSubmissions, reward, permissions, submissions } = props;
  const { refreshReward } = useRewards();
  const { user } = useUser();
  const [showApplication, setShowApplication] = useState(false);
  const userApplication = submissions.find((s) => s.createdBy === user?.id);

  // Only applies if there is a submissions cap
  const capReached = submissionsCapReached({
    bounty: reward,
    submissions
  });

  const canCreateApplication = !userApplication && !reward.submissionsLocked && !capReached && permissions?.work;

  const newSubmissionTooltip = reward.submissionsLocked
    ? 'Submissions locked'
    : !permissions?.work
    ? 'You do not have the correct role to work on this bounty'
    : capReached
    ? 'The submissions cap has been reached. This bounty is closed to new submissions.'
    : '';

  async function submitApplication() {
    setShowApplication(false);
    refreshSubmissions();
    await refreshReward(reward.id);
  }

  // do not show option to apply in card if user already applied
  if (userApplication || !canCreateApplication) {
    return null;
  }

  if (reward.approveSubmitters) {
    return (
      <>
        {!showApplication ? (
          <Box display='flex' justifyContent='center' my={2} mb={3}>
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
            bountyId={reward.id}
            mode='create'
            onSubmit={submitApplication}
            onCancel={() => {
              setShowApplication(false);
            }}
          />
        )}

        <Divider
          sx={{
            my: 3
          }}
        />
      </>
    );
    // Submissions cap exists and user has applied
  }

  return (
    <>
      {!showApplication ? (
        <Box display='flex' justifyContent='center' my={2} mb={3}>
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
          bountyId={reward.id}
          onSubmit={submitApplication}
          onCancel={() => {
            setShowApplication(false);
          }}
          hasCustomReward={reward.customReward !== null}
          submission={userApplication}
          permissions={permissions}
          alwaysExpanded
        />
      )}

      <Divider
        sx={{
          my: 3
        }}
      />
    </>
  );
}
