
import { getNotifications, sendUserNotifications } from 'background/tasks/sendNotifications/sendNotifications';

(async () => {
  const r = await sendUserNotifications();
  console.log('result', r);
})();
