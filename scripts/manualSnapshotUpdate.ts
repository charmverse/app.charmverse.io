// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';

export async function updateSnapshot(proposalId: string, snapshotProposalId: string) {
  throw new Error('script has not been updated for new propsoal flow');
  return prisma.page.update({
    where: {
      id: proposalId
    },
    data: {
      snapshotProposalId,
      proposal: {
        update: {
          status: 'vote_active'
        }
      }
    },
    select: {
      title: true,
      proposal: true
    }
  });
}

updateSnapshot(
  '53bf33bd-3227-4bf1-80a0-977049558d4e',
  '0x608db5244b38e3c1acc5435ff3d1c6a61cd71c78825e1dfb01ad1ae82dfebfa0'
).then((updated) => console.log('Processed proposal:', updated.title));
