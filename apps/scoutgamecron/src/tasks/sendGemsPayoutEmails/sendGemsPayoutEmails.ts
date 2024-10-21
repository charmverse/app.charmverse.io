import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { sendEmail } from '@packages/mailer/mailer';
import { getCurrentWeek, getLastWeek } from '@packages/scoutgame/dates';
import { getClaimablePoints } from '@packages/scoutgame/points/getClaimablePoints';
import { render } from '@react-email/render';
import { DateTime } from 'luxon';

import { ClaimPointsTemplate } from './templates/ClaimPointsTemplate';

export async function sendGemsPayoutEmails() {
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

  let totalEmailsSent = 0;

  for (const scout of scouts) {
    try {
      const weeklyClaimablePoints = await getClaimablePoints({ userId: scout.id, week: getLastWeek(DateTime.utc()) });
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
