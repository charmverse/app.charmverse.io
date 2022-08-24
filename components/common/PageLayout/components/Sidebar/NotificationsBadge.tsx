import { Badge } from '@mui/material';
import useTasks from 'components/nexus/hooks/useTasks';
import { useUser } from 'hooks/useUser';

export default function NotificationsBadge ({ children }: { children: JSX.Element }) {

  const { user } = useUser();
  const { tasks } = useTasks();

  const userNotificationState = user?.notificationState;
  // If the user has snoozed multisig tasks don't count them
  const totalTasks = tasks
    ? (tasks.votes.length + tasks.mentioned.unmarked.length + (userNotificationState
      ? (userNotificationState.snoozedUntil && new Date(userNotificationState.snoozedUntil) > new Date() ? 0
        : tasks.gnosis.length) : tasks.gnosis.length))
    : 0;

  return (
    <Badge
      badgeContent={4}
      overlap='circular'
      color='error'
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      max={99}
    >
      {children}
    </Badge>
  );
}
