import { Box, Button, FormLabel, Stack, Tooltip } from '@mui/material';
import { Application, Bounty } from '@prisma/client';
import { useUser } from 'hooks/useUser';
import { submissionsCapReached } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties';
import { useState } from 'react';
import { ApplicationEditorForm } from '../components/ApplicationEditorForm';

interface BountyApplicationFormProps {
  permissions: AssignedBountyPermissions
  bounty: Bounty
  submissions: Application[]
}

export default function BountyApplicationForm (props: BountyApplicationFormProps) {
  const { bounty, permissions, submissions } = props;

  const [user] = useUser();

  const [isApplyingBounty, setIsApplyingBounty] = useState(false);

  const userSubmission = submissions.find(sub => sub.createdBy === user?.id);
  // Only applies if there is a submissions cap
  const capReached = submissionsCapReached({ bounty, submissions });
  const canCreateSubmission = !userSubmission && !capReached && permissions?.userPermissions.work && bounty.createdBy !== user?.id;
  const newSubmissionTooltip = !permissions?.userPermissions.work ? 'You do not have the correct role to submit work to this bounty' : (capReached ? 'The submissions cap has been reached. This bounty is closed to new submissions.' : 'Apply to this bounty.');

  if (!userSubmission) {
    if (!isApplyingBounty && bounty.createdBy !== user?.id) {
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
      return (
        <Stack my={1} gap={1}>
          <FormLabel sx={{
            fontWeight: 'bold'
          }}
          >Application
          </FormLabel>
          <ApplicationEditorForm
            bountyId={bounty.id}
            mode='create'
            onSubmit={() => {
              setIsApplyingBounty(false);
            }}
            onCancel={() => {
              setIsApplyingBounty(false);
            }}
          />
        </Stack>
      );
    }
  }

  return null;
}
