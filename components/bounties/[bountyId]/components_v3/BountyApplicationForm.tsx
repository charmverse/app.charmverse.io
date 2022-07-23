import { Box, Button, Stack, Tooltip } from '@mui/material';
import { Application, Bounty } from '@prisma/client';
import { useBounties } from 'hooks/useBounties';
import { useUser } from 'hooks/useUser';
import { AssignedBountyPermissions } from 'lib/bounties';
import { useState } from 'react';
import { ApplicationEditorForm } from '../components/ApplicationEditorForm';
import SubmissionEditorForm from './SubmissionEditorForm';

interface BountyApplicationFormProps {
  permissions: AssignedBountyPermissions
  bounty: Bounty
  submissions: Application[]
  refreshSubmissions: () => Promise<void>
  validSubmissionsCount: number
}

export default function BountyApplicationForm (props: BountyApplicationFormProps) {
  const { validSubmissionsCount, refreshSubmissions, bounty, permissions, submissions } = props;

  const [user] = useUser();
  const { refreshBounty } = useBounties();

  const [isApplyingBounty, setIsApplyingBounty] = useState(false);

  const userSubmission = submissions.find(sub => sub.createdBy === user?.id);
  // Only applies if there is a submissions cap
  const capReached = bounty.maxSubmissions !== null && (validSubmissionsCount >= bounty.maxSubmissions);
  const canCreateSubmission = !userSubmission && !capReached && permissions?.userPermissions.work && bounty.createdBy !== user?.id;
  const newSubmissionTooltip = !permissions?.userPermissions.work ? 'You do not have the correct role to submit work to this bounty' : (capReached ? 'The submissions cap has been reached. This bounty is closed to new submissions.' : 'Apply to this bounty.');

  if (!userSubmission) {
    if (!isApplyingBounty && bounty.createdBy !== user?.id && !permissions.userPermissions.review) {
      return (
        <Tooltip placement='top' title={newSubmissionTooltip}>
          <Stack justifyContent='center' width='100%' flexDirection='row' my={2}>
            <Box component='span'>
              <Button
                disabled={!canCreateSubmission}
                onClick={() => {
                  setIsApplyingBounty(true);
                }}
              >
                Apply
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
          onCancel={() => setIsApplyingBounty(false)}
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
