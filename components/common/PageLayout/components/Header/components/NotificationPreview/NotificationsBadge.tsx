import type { BadgeProps } from '@mui/material';
import { Badge } from '@mui/material';

import { useNotifications } from 'hooks/useNotifications';

export default function NotificationsBadge({ children, ...badgeProps }: BadgeProps & { children: JSX.Element }) {
  const { notifications } = useNotifications();

  const voteTasksCount =
    notifications?.votes.unmarked.filter((vote) => new Date() < new Date(vote.deadline)).length ?? 0;
  const mentionTasksCount = notifications?.discussions.unmarked?.length ?? 0;
  // If the user has snoozed multisig notifications don't count them
  const proposalTasksCount = notifications?.proposals.unmarked.length ?? 0;
  const forumTasksCount = notifications?.forum.unmarked.length ?? 0;
  const bountyTasksCount = notifications?.bounties.unmarked.length ?? 0;

  const totalTasks = voteTasksCount + mentionTasksCount + proposalTasksCount + forumTasksCount + bountyTasksCount;

  return (
    <Badge
      badgeContent={totalTasks}
      overlap='circular'
      color='error'
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      max={99}
      sx={{ cursor: 'pointer' }}
      {...badgeProps}
    >
      {children}
    </Badge>
  );
}
