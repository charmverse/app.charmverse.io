import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { chargeSpaceSubscription } from '@root/lib/subscription/chargeSpaceSubscription';

export async function task() {
  log.debug('Running charge spaces subscription cron job');

  try {
    const spaces = await prisma.space.findMany({
      where: {
        subscriptionTier: {
          not: {
            in: ['free', 'readonly', 'grant']
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
