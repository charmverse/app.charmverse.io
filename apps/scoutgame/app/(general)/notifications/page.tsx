import { getNotifications } from '@packages/scoutgame/notifications/getNotifications';

import { NotificationsPage } from 'components/notifications/NotificationsPage';
import { getUserFromSession } from 'lib/session/getUserFromSession';

export default async function Page() {
  const user = await getUserFromSession();

  if (!user) {
    return null;
  }

  const notifications = await getNotifications({
    userId: user.id
  });

  return <NotificationsPage notifications={notifications} />;
}
