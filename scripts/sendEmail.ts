
import { sendEmail } from 'lib/mailer';

(async () => {

  const r = await sendEmail({
    html: 'This is a test email',
    subject: 'Test Email',
    to: {
      email: 'matt.casey@charmverse.io',
      displayName: 'Matteo'
    }
  });

  console.log('Sent email', r);

})();
