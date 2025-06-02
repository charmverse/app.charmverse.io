import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { chargeSpaceSubscription } from '@packages/subscriptions/chargeSpaceSubscription';
import { DateTime } from 'luxon';

export async function task() {
  const startOfMonth = DateTime.now().startOf('month');
  const endOfMonth = DateTime.now().endOf('month');

  try {
    const spaces = await prisma.space.findMany({
      where: {
        // Only charge spaces that don't have any subscription payment in the current month
        subscriptionPayments: {
          none: {
            createdAt: {
              gte: startOfMonth.toJSDate(),
              lte: endOfMonth.toJSDate()
            }
          }
        },
        subscriptionTier: {
          notIn: ['free', 'readonly', 'grant']
        }
      },
      select: {
        id: true
      }
    });
    log.info('[cron-subscriptions] Found', spaces.length, 'spaces to charge', { startOfMonth, endOfMonth });

    for (const space of spaces) {
      try {
        await chargeSpaceSubscription({ spaceId: space.id });
      } catch (error: any) {
        log.error(`[cron-subscriptions] Error charging space subscription: ${error.stack || error.message || error}`, {
          error
        });
      }
    }
  } catch (error: any) {
    log.error(`[cron-subscriptions] Error verifying token gate memberships: ${error.stack || error.message || error}`, {
      error
    });
  }
}
