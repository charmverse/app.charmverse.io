import { styled } from '@mui/material';
import { IconButton, Tooltip } from '@mui/material';
import { MdOutlineNotificationsNone, MdOutlineNotificationsOff } from 'react-icons/md';

import { useForumCategoryNotification } from 'hooks/useUserSpaceNotifications';

const OutlinedIconButton = styled(IconButton)`
  border: 1px solid var(--input-border);
`;

export function CategoryNotificationToggle({ categoryId }: { categoryId: string }) {
  const { enabled, isLoading, toggle } = useForumCategoryNotification(categoryId);
  const icon = enabled ? <MdOutlineNotificationsNone /> : <MdOutlineNotificationsOff />;
  const tooltipMessage = enabled ? 'Disable notifications for this category' : 'Enable notifications';
  if (isLoading) {
    return null;
  }
  return (
    <Tooltip title={tooltipMessage}>
      <OutlinedIconButton onClick={toggle}>{icon}</OutlinedIconButton>
    </Tooltip>
  );
}
