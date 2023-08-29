import type { BadgeProps } from '@mui/material';
import { Badge } from '@mui/material';

import { useTasks } from 'components/nexus/hooks/useTasks';

export default function NotificationsBadge({ children, ...badgeProps }: BadgeProps & { children: JSX.Element }) {
  const { tasks } = useTasks();

  const voteTasksCount = tasks?.votes.unmarked.filter((vote) => new Date() < new Date(vote.deadline)).length ?? 0;
  const mentionTasksCount = tasks?.discussions.unmarked?.length ?? 0;
  // If the user has snoozed multisig tasks don't count them
  const proposalTasksCount = tasks?.proposals.unmarked.length ?? 0;
  const forumTasksCount = tasks?.forum.unmarked.length ?? 0;
  const bountyTasksCount = tasks?.bounties.unmarked.length ?? 0;

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
