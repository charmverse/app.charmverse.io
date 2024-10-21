import { getSession } from '@connect-shared/lib/session/getSession';
import { getNotifications } from '@packages/scoutgame/notifications/getNotifications';

import { NotificationsPage } from 'components/notifications/NotificationsPage';

export default async function Page() {
  const { scoutId } = await getSession();

  const notifications = scoutId
    ? await getNotifications({
        userId: scoutId
      })
    : [];

  return <NotificationsPage notifications={notifications} />;
}
