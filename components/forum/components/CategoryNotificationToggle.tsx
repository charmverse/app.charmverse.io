import { IconButton, Menu, MenuItem } from '@mui/material';
import { MdOutlineNotificationsNone, MdOutlineNotificationsOff } from 'react-icons/md';

import { useForumCategoryNotification } from 'hooks/useUserSpaceNotifications';

export function CategoryNotificationToggle({ categoryId }: { categoryId: string }) {
  const { enabled, isLoading, toggle } = useForumCategoryNotification(categoryId);
  const icon = enabled ? <MdOutlineNotificationsNone /> : <MdOutlineNotificationsOff />;
  if (isLoading) {
    return null;
  }
  return <IconButton onClick={toggle}>{icon}</IconButton>;
}
