import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmail } from '@packages/mailer/mailer';
import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { render } from '@react-email/render';

import { ClaimPointsTemplate } from './ClaimPointsTemplate';

export async function sendGemsPayoutEmails({ week }: { week: string }) {
  const scouts = await prisma.scout.findMany({
    where: {
      email: {
        not: null
      }
    },
    select: {
      id: true,
      displayName: true,
      email: true
    }
  });

  let totalEmailsSent = 0;

  for (const scout of scouts) {
    try {
      const { points: weeklyClaimablePoints } = await getClaimablePoints({ userId: scout.id, week });
      if (weeklyClaimablePoints) {
        const html = await render(
          ClaimPointsTemplate({ points: weeklyClaimablePoints, displayName: scout.displayName })
        );
        await sendEmail({
          to: {
            displayName: scout.displayName,
            email: scout.email!,
            userId: scout.id
          },
          senderAddress: `The Scout Game <updates@mail.scoutgame.xyz>`,
          subject: 'Congratulations you just earned points in the Scout Game',
          html
        });
        totalEmailsSent += 1;
      }
    } catch (error) {
      log.error('Error sending points claim email', { error, scoutId: scout.id });
    }
  }

  return totalEmailsSent;
}
