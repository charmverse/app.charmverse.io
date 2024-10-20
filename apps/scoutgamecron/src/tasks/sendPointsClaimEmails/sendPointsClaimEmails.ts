import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmail } from '@packages/mailer/mailer';
import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { render } from '@react-email/render';

import { ClaimPointsTemplate } from './templates/ClaimPointsTemplate';

export async function sendPointsClaimEmails() {
  const scouts = await prisma.scout.findMany({
    where: {
      email: {
        not: null
      }
    },
    select: {
      id: true,
      username: true,
      displayName: true,
      email: true
    }
  });

  for (const scout of scouts) {
    try {
      const pointsToClaim = await getClaimablePoints(scout.id);

      if (pointsToClaim.totalClaimablePoints) {
        const html = await render(
          ClaimPointsTemplate({ points: pointsToClaim.totalClaimablePoints, displayName: scout.displayName })
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
      }
    } catch (error) {
      log.error('Error sending points claim email', { error, scoutId: scout.id });
    }
  }
}
