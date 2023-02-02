import { sendEmail } from 'lib/mailer';
import log from 'lib/log';

/**
 * See the docs for more info on how to use this script:
 * https://app.charmverse.io/charmverse/page-2517846892483364
 */
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
