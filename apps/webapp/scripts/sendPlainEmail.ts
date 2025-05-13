import { getPlainEmail } from 'lib/mailer/emails/emails';
import { sendEmail } from 'lib/mailer';
import { prisma } from '@charmverse/core/prisma-client';

(async () => {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      email: 'matt.casey@charmverse.io'
    }
  });
  const template = await getPlainEmail();

  // return;
  // for (const user of usersToSend) {
  try {
    await sendEmail({
      to: { userId: user.id, displayName: user.username, email: user.email! },
      subject: template.subject,
      html: template.html
    });
  } catch (e) {
    console.error('Error sending email to user', user, e);
  }
  // if (users.indexOf(user) % 10 === 0) {
  //   console.log('Sent emails:', users.indexOf(user));
  // }
  // }
})();
