import { sendUserNotifications } from 'lib/notifications/mailer/sendNotifications';

(async () => {
  const r = await sendUserNotifications();
  console.log('result', r);
})();
