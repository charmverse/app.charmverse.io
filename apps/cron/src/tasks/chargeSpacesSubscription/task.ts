import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { chargeSpaceSubscription } from '@packages/subscriptions/chargeSpaceSubscription';
import { DateTime } from 'luxon';

export async function task() {
  log.debug('Running charge spaces subscription cron job');

  const startOfMonth = DateTime.now().startOf('month');

  try {
    const spaces = await prisma.space.findMany({
      where: {
        AND: [
          {
            subscriptionTier: {
              not: null
            }
          },
          { subscriptionTier: { not: 'grant' } }
        ],
        // Only charge spaces that don't have a subscription payment in the current month
        subscriptionPayments: {
          none: {
            createdAt: startOfMonth.toJSDate()
          }
        }
      },
      select: {
        id: true
      }
    });

    for (const space of spaces) {
      try {
        await chargeSpaceSubscription({ spaceId: space.id });
      } catch (error: any) {
        log.error(`Error charging space subscription: ${error.stack || error.message || error}`, { error });
      }
    }
  } catch (error: any) {
    log.error(`Error verifying token gate memberships: ${error.stack || error.message || error}`, { error });
  }
}
