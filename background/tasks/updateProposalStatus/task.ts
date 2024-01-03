import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';

import { count } from 'lib/metrics';

export async function task() {
  log.debug('Running Proposal status cron job');

  try {
    const stepsToUpdate = await prisma.proposalEvaluation.findMany({
      where: {
        result: null,
        snapshotExpiry: {
          not: null,
          lte: new Date()
        }
      }
    });

    await prisma.proposalEvaluation.updateMany({
      where: {
        id: {
          in: stepsToUpdate.map((evaluation) => evaluation.id)
        }
      },
      data: {
        result: 'pass'
      }
    });

    count('cron.proposal-status.expired-snapshot-votes', stepsToUpdate.length);
  } catch (error: any) {
    log.error(`Error expiring proposals: ${error.stack || error.message || error}`, { error });
  }
}
