import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import { Badge, IconButton, Tooltip } from '@mui/material';
import Link from 'components/common/Link';
import useTasks from 'components/nexus/hooks/useTasks';
import { useUser } from 'hooks/useUser';

export default function NotificationsBadge () {

  const [user] = useUser();
  const { tasks } = useTasks();

  const userNotificationState = user?.notificationState;
  // If the user has snoozed multisig tasks don't count them
  const totalTasks = tasks
    ? (tasks.mentioned.unmarked.length + (userNotificationState
      ? (userNotificationState.snoozedUntil && new Date(userNotificationState.snoozedUntil) > new Date() ? 0
        : tasks.gnosis.length) : tasks.gnosis.length))
    : 0;

  return (
    <Link href='/nexus'>
      <IconButton size='small' sx={{ mr: 1 }}>
        <Tooltip arrow title='Your Notifications'>
          <Badge
            badgeContent={2}
            color='error'
            sx={{
              '& .MuiBadge-badge:hover': {
                transform: 'scale(1.25) translate(50%, -50%)',
                transition: '250ms ease-in-out transform'
              }
            }}
          // variant='dot'
            max={99}
          >
            <NotificationsNoneIcon />
          </Badge>
        </Tooltip>
      </IconButton>
    </Link>
  );
}
