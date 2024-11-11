import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { encodeContributionReceiptAttestation, encodeScoutGameUserProfileAttestation } from '@charmverse/core/protocol';

import { multiAttestOnchain, type ScoutGameAttestationInput } from './attestOnchain';
import {
  scoutGameAttestationChainId,
  scoutGameContributionReceiptSchemaUid,
  scoutGameUserProfileSchemaUid
} from './constants';
import { attestationLogger } from './logger';
import { uploadContributionReceiptToS3 } from './uploadContributionReceiptToS3';
import { uploadScoutProfileToS3 } from './uploadScoutProfileToS3';

const minimumGemsDate = new Date('2024-11-04T00:00:00Z');

export async function attestGemReceipts(): Promise<void> {
  const gemsReceiptQuery: Prisma.GemsReceiptWhereInput = {
    createdAt: {
      gte: minimumGemsDate
    },
    event: {
      githubEvent: {
        type: {
          in: ['commit', 'merged_pull_request']
        }
      },
      builder: {
        builderStatus: 'approved'
      }
    },
    OR: [
      {
        onchainAttestationUid: null
      },
      {
        onchainChainId: {
          not: scoutGameAttestationChainId
        }
      }
    ]
  };

  const usersWithoutProfile = await prisma.scout.findMany({
    where: {
      onchainProfileAttestationUid: null,
      events: {
        some: {
          gemsReceipt: gemsReceiptQuery
        }
      }
    },
    select: {
      id: true,
      path: true,
      displayName: true
    }
  });

  const usersToProcess = usersWithoutProfile.length;

  const missingProfileInputs: Omit<ScoutGameAttestationInput, 'schemaId'>[] = [];

  for (let i = 0; i < usersToProcess; i++) {
    const user = usersWithoutProfile[i];
    attestationLogger.info(`Populating profile attestion for user ${user.id} ${i + 1} / ${usersToProcess}`);

    const { metadataUrl } = await uploadScoutProfileToS3({
      scoutId: user.id,
      metadata: {
        displayName: user.displayName,
        path: user.path
      }
    });

    missingProfileInputs.push({
      data: encodeScoutGameUserProfileAttestation({
        id: user.id,
        metadataUrl
      })
    });
  }

  const onchainProfileAttestationUids = await multiAttestOnchain({
    schemaId: scoutGameUserProfileSchemaUid(),
    records: missingProfileInputs
  });

  for (let i = 0; i < usersToProcess; i++) {
    const user = usersWithoutProfile[i];
    const attestationUid = onchainProfileAttestationUids[i];

    await prisma.scout.update({
      where: {
        id: user.id
      },
      data: {
        onchainProfileAttestationChainId: scoutGameAttestationChainId,
        onchainProfileAttestationUid: attestationUid
      }
    });
  }

  const gemsReceiptWithValidUserQuery: Prisma.GemsReceiptWhereInput = {
    ...gemsReceiptQuery,
    event: {
      ...gemsReceiptQuery.event,
      builder: {
        builderStatus: 'approved',
        onchainProfileAttestationUid: {
          not: null
        },
        onchainProfileAttestationChainId: scoutGameAttestationChainId
      } as any
    }
  };

  const gemReceiptsWithoutAttestation = await prisma.gemsReceipt.findMany({
    where: gemsReceiptWithValidUserQuery,
    select: {
      id: true,
      type: true,
      value: true,
      event: {
        select: {
          builder: {
            select: {
              id: true,
              onchainProfileAttestationUid: true
            }
          },
          githubEvent: {
            select: {
              commitHash: true,
              pullRequestNumber: true,
              repo: {
                select: {
                  id: true,
                  owner: true,
                  name: true
                }
              }
            }
          }
        }
      }
    }
  });

  function getDescription(ev: (typeof gemReceiptsWithoutAttestation)[number]) {
    return ev.type === 'daily_commit'
      ? `Contributed a regular commit to the repository`
      : ev.type === 'first_pr'
        ? 'First pull request in the repository'
        : ev.type === 'regular_pr'
          ? 'Authored pull request in the repository'
          : ev.type === 'third_pr_in_streak'
            ? 'Third pull request in a streak'
            : '';
  }

  function getUrl(ev: (typeof gemReceiptsWithoutAttestation)[number]) {
    return ev.type === 'daily_commit'
      ? `https://github.com/${ev.event.githubEvent?.repo.owner}/${ev.event.githubEvent?.repo.name}/commit/${ev.event.githubEvent?.commitHash}`
      : `https://github.com/${ev.event.githubEvent?.repo.owner}/${ev.event.githubEvent?.repo.name}/pull/${ev.event.githubEvent?.pullRequestNumber}`;
  }

  const attestationInputs: Omit<ScoutGameAttestationInput, 'schemaId'>[] = [];

  for (const ev of gemReceiptsWithoutAttestation) {
    const { metadataUrl } = await uploadContributionReceiptToS3({
      scoutId: ev.event.builder.id,
      gemReceiptId: ev.id,
      metadata: {
        description: getDescription(ev)
      }
    });

    attestationInputs.push({
      refUID: ev.event.builder.onchainProfileAttestationUid as `0x${string}`,
      data: encodeContributionReceiptAttestation({
        value: ev.value,
        type: ev.type,
        metadataUrl,
        userRefUID: ev.event.builder.onchainProfileAttestationUid as `0x${string}`,
        description: getDescription(ev),
        url: getUrl(ev)
      })
    });
  }

  await multiAttestOnchain({
    schemaId: scoutGameContributionReceiptSchemaUid(),
    records: attestationInputs,
    onAttestSuccess: async ({ attestationUid, index }) => {
      const event = gemReceiptsWithoutAttestation[index];

      await prisma.gemsReceipt.update({
        where: {
          id: event.id
        },
        data: {
          onchainChainId: scoutGameAttestationChainId,
          onchainAttestationUid: attestationUid
        }
      });
    }
  });

  attestationLogger.info(`Attested ${attestationInputs.length} gem receipts`);
}
