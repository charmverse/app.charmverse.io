import { Box, ButtonProps, Tooltip } from '@mui/material';
import { Application, Bounty } from '@prisma/client';
import Button from 'components/common/Button';
import { useUser } from 'hooks/useUser';
import { submissionsCapReached } from 'lib/applications/shared';
import { AssignedBountyPermissions } from 'lib/bounties';

interface BountyApplyButtonProps {
  applications: Application[]
  bounty: Bounty
  permissions?: AssignedBountyPermissions | null
  onClick: ButtonProps['onClick']
}

export default function BountyApplyButton ({ onClick, permissions, bounty, applications }: BountyApplyButtonProps) {
  const [user] = useUser();
  const userApplication = applications.find(app => app.createdBy === user?.id);

  const userHasApplied = userApplication !== undefined;

  const newApplicationsSuspended = submissionsCapReached({
    bounty,
    submissions: applications
  });

  const submissionsCapSentence = `The cap of ${bounty.maxSubmissions} submission${bounty.maxSubmissions !== 1 ? 's'
    : ''} has been reached.`;

  const applyButtonTooltipTitle = !permissions?.userPermissions.work ? 'You cannot apply to this bounty.'
    : newApplicationsSuspended ? submissionsCapSentence : '';

  return !userHasApplied ? (
    <Tooltip
      title={applyButtonTooltipTitle}
    >
      <Box component='span'>
        <Button
          disabled={newApplicationsSuspended || !permissions?.userPermissions.work}
          onClick={onClick}
        >Apply to this bounty
        </Button>
      </Box>
    </Tooltip>
  ) : null;
}
