import { prisma } from '@charmverse/core/prisma-client';
import { upsertBlock as upsertProposalBlock } from '@packages/lib/proposals/blocks/upsertBlock';
import { upsertBlock as upsertRewardBlock } from 'lib/rewards/blocks/upsertBlock';

export async function migrateRewardsBlocks() {
  const blocks = await prisma.rewardBlock.findMany({
    where: {
      type: 'board'
    }
  });

  const customIdBlocks = blocks.filter((block) => block.id !== '__defaultBoard');
  console.log('🔥', 'Reward Blocks to migrate:', customIdBlocks.length);

  let i = 1;
  for (const oldBlock of customIdBlocks) {
    console.log('🔥', `Migrating no: ${i}`);
    const existingBoardBlock = blocks.find(
      (block) => block.id === '__defaultBoard' && block.spaceId === oldBlock.spaceId
    );

    const udpatedFields = existingBoardBlock?.fields
      ? {
          ...(existingBoardBlock.fields as any),
          ...(oldBlock.fields as any),
          viewIds: ['__defaultView', '__defaultBoardView', '__defaultCalendarView']
        }
      : oldBlock.fields;

    await upsertRewardBlock({
      spaceId: oldBlock.spaceId,
      userId: oldBlock.createdBy,
      data: { id: oldBlock.id, type: 'board', fields: udpatedFields }
    });

    i++;
  }
}

export async function migrateProposalsBlocks() {
  const blocks = await prisma.proposalBlock.findMany({
    where: {
      type: 'board'
    }
  });

  const customIdBlocks = blocks.filter((block) => block.id !== '__defaultBoard');
  console.log('🔥', 'Proposal Blocks to migrate:', customIdBlocks.length);

  let i = 1;
  for (const oldBlock of customIdBlocks) {
    console.log('🔥', `Migrating no: ${i}`);
    const existingBoardBlock = blocks.find(
      (block) => block.id === '__defaultBoard' && block.spaceId === oldBlock.spaceId
    );

    const udpatedFields = existingBoardBlock?.fields
      ? { ...(existingBoardBlock.fields as any), ...(oldBlock.fields as any) }
      : oldBlock.fields;

    await upsertProposalBlock({
      spaceId: oldBlock.spaceId,
      userId: oldBlock.createdBy,
      data: { id: oldBlock.id, type: 'board', fields: udpatedFields }
    });

    i++;
  }
}

async function deleteOldBlocks() {
  const rewardsDelete = await prisma.rewardBlock.deleteMany({
    where: {
      type: 'board',
      id: {
        not: '__defaultBoard'
      }
    }
  });

  console.log('🔥', 'Deleted rewards blocks:', rewardsDelete.count);

  const proposalsDelete = await prisma.proposalBlock.deleteMany({
    where: {
      type: 'board',
      id: {
        not: '__defaultBoard'
      }
    }
  });

  console.log('🔥', 'Deleted proposals blocks:', proposalsDelete.count);
}

// migrateProposalsBlocks();
migrateRewardsBlocks();

// deleteOldBlocks();
