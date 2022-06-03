
import { getNotifications, sendUserNotifications } from 'background/tasks/sendNotifications/sendNotifications';

(async () => {
  const r = await getNotifications();
  console.log('result', r);
})();
