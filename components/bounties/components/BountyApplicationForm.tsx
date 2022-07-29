import { Box, Button, Stack, Tooltip } from '@mui/material';
import { Application, Bounty } from '@prisma/client';
import { useBounties } from 'hooks/useBounties';
import { useUser } from 'hooks/useUser';
import { countValidSubmissions } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties';
import { useState } from 'react';
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
  const [user] = useUser();
  const { refreshBounty } = useBounties();

  const [isApplyingBounty, setIsApplyingBounty] = useState(false);

  const userSubmission = submissions.find(sub => sub.createdBy === user?.id);
  // Only applies if there is a submissions cap
  const capReached = bounty.maxSubmissions !== null && (validSubmissionsCount >= bounty.maxSubmissions);
  const canCreateSubmission = !bounty.submissionsLocked
    && !userSubmission
    && !capReached
    && permissions?.userPermissions.work
    && bounty.createdBy !== user?.id;
  const newSubmissionTooltip = bounty.submissionsLocked ? 'Submissions locked' : !permissions?.userPermissions.work ? 'You do not have the correct role to submit work to this bounty' : (capReached ? 'The submissions cap has been reached. This bounty is closed to new submissions.' : '');

  if (!userSubmission) {
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
        />
      );
    }
  }

  return null;
}
