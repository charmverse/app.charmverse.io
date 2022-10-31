import { Badge } from '@mui/material';

import useTasks from 'components/nexus/hooks/useTasks';
import { useUser } from 'hooks/useUser';

export default function NotificationsBadge ({ children }: { children: JSX.Element }) {

  const { user } = useUser();
  const { tasks, gnosisTasks } = useTasks();

  const userNotificationState = user?.notificationState;

  const voteTasksCount = tasks?.votes.filter(vote => !vote.userChoice && new Date() < new Date(vote.deadline)).length ?? 0;
  const mentionTasksCount = tasks?.discussions.unmarked.length ?? 0;
  // If the user has snoozed multisig tasks don't count them
  const excludeGnosisTasks = userNotificationState?.snoozedUntil && new Date(userNotificationState.snoozedUntil) > new Date();
  const gnosisTasksCount = excludeGnosisTasks ? 0 : gnosisTasks?.length ?? 0;
  const proposalTasksCount = tasks?.proposals.unmarked.length ?? 0;

  const totalTasks = voteTasksCount + mentionTasksCount + gnosisTasksCount + proposalTasksCount;

  return (
    <Badge
      badgeContent={totalTasks}
      overlap='circular'
      color='error'
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      max={99}
    >
      {children}
    </Badge>
  );
}
