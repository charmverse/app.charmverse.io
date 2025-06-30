import { log } from '@packages/core/log';

import { sendEmail } from 'lib/mailer';
import { v4 } from 'uuid';

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
      displayName: 'Matteo',
      userId: v4()
    }
  });

  log.info('Sent email', r);
})();
