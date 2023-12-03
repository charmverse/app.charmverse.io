import { prisma } from '@charmverse/core/prisma-client';
import { createTestProposal } from 'lib/proposal/createTestProposal';
import { upsertDefaultRewardsBoard } from 'lib/rewards/blocks/upsertDefaultRewardsBoard';
import { createTestReward } from 'lib/rewards/createTestReward';

export async function createTestRewardsAndProposals() {
  const spaces = await prisma.space.findMany({
    select: {
      id: true,
      createdBy: true,
      proposalCategories: {
        where: {
          title: "General"
        },
        select: {
          id: true
        },
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
  })

  for (const space of spaces) {
    try {
      if (space.bounties.length === 0) {
        await createTestReward({
          spaceId: space.id,
          userId: space.createdBy
        })
    
        await upsertDefaultRewardsBoard({ spaceId: space.id, userId: space.createdBy });
      }
  
      if (space.proposals.length === 0) {
        await createTestProposal({
          spaceId: space.id,
          userId: space.createdBy,
          categoryId: space.proposalCategories[0]?.id
        })
      }
    } catch (err) {
      console.error(`Failed to create test rewards and proposals for space ${space.id}`)
    }
  }
}

createTestRewardsAndProposals();