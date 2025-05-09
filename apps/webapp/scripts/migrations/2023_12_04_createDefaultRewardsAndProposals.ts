// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';
import { createDefaultProposal } from '@packages/lib/proposals/createDefaultProposal';
import { upsertDefaultRewardsBoard } from 'lib/rewards/blocks/upsertDefaultRewardsBoard';
import { createDefaultReward } from 'lib/rewards/createDefaultReward';

export async function createDefaultRewardsAndProposals() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true,
      proposalCategories: {
        where: {
          title: 'General'
        },
        select: {
          id: true
        }
      },
      bounties: {
        select: {
          id: true
        },
        take: 1
      },
      proposals: {
        select: {
          id: true
        },
        take: 1
      }
    }
  });

  const totalSpaces = spaces.length;
  let count = 0;

  for (const space of spaces) {
    try {
      if (space.bounties.length === 0) {
        await createDefaultReward({
          spaceId: space.id,
          userId: space.createdBy
        });

        await upsertDefaultRewardsBoard({ spaceId: space.id, userId: space.createdBy });
      }

      if (space.proposals.length === 0) {
        await createDefaultProposal({
          spaceId: space.id,
          userId: space.createdBy,
          // @ts-ignore
          categoryId: space.proposalCategories[0]?.id
        });
      }
    } catch (err) {
      console.error(`Failed to create test rewards and proposals for space ${space.id}`);
    }

    count += 1;
    console.log(`Created default rewards and proposals for space ${space.id} (${count}/${totalSpaces})`);
  }
}

createDefaultRewardsAndProposals();
