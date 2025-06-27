import { prisma } from '@charmverse/core/prisma-client';
import { log } from '@packages/core/log';
import type { EasSchemaChain } from '@packages/credentials/connectors';
import { indexGnosisSafeCredentialTransaction } from '@packages/credentials/indexGnosisSafeCredentialTransaction';
import { count } from '@packages/metrics';

export async function indexPendingCredentialsTask() {
  log.debug('Running Credential indexing cron job');

  const pendingCredentials = await prisma.pendingSafeTransaction.findMany({
    where: {
      processed: false
    }
  });

  for (const pendingCredential of pendingCredentials) {
    await indexGnosisSafeCredentialTransaction({
      chainId: pendingCredential.chainId as EasSchemaChain,
      safeTxHash: pendingCredential.safeTxHash
    });
  }

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
