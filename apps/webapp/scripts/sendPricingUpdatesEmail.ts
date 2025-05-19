import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmail } from '@packages/lib/mailer';
import { getPricingChangeEmail } from '@packages/lib/mailer/emails/emails';

async function sendPricingUpdatesEmail() {
  const spaces = await prisma.space.findMany({
    where: {
      paidTier: {
        not: 'enterprise'
      }
    },
    select: {
      name: true,
      spaceRoles: {
        where: {
          isAdmin: true
        },
        select: {
          user: {
            select: {
              username: true,
              email: true
            }
          }
        }
      }
    }
  });

  const totalSpaceRoles = spaces.reduce((acc, space) => acc + space.spaceRoles.length, 0);
  let count = 0;

  for (const space of spaces) {
    for (const spaceRole of space.spaceRoles) {
      const email = spaceRole.user.email;

      if (email) {
        try {
          const pricingEmail = await getPricingChangeEmail({
            adminName: spaceRole.user.username,
            spaceName: space.name
          });

          await sendEmail({
            html: pricingEmail.html,
            subject: pricingEmail.subject,
            to: {
              email
            }
          });
        } catch (e) {
          log.error('Error sending pricing updates email', e);
        } finally {
          count += 1;
          log.info(`Sent ${count} of ${totalSpaceRoles} pricing updates emails`);
        }
      }
    }
  }
}

sendPricingUpdatesEmail();
