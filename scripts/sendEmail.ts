
import { sendEmail } from 'lib/mailer';
import log from 'lib/log';

(async () => {

  const r = await sendEmail({
    html: 'This is a test email',
    subject: 'Test Email',
    to: {
      email: 'matt.casey@charmverse.io',
      displayName: 'Matteo'
    }
  });

  log.info('Sent email', r);

})();
