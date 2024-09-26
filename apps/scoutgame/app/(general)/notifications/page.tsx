import { getNotifications } from '@packages/scoutgame/notifications/getNotifications';

import { NotificationList } from 'components/notifications/NotificationList';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function NotificationsPage() {
  const session = await getUserFromSession();

  const notifications = await getNotifications({
    userId: session!.id
  });

  return <NotificationList notifications={notifications} />;
}
