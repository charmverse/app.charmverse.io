import { prisma } from '@charmverse/core/prisma-client';

async function migrateAllProposalDatabases() {
  const rewardViews = await prisma.rewardBlock.findMany({
    where: {
      type: 'view'
    }
  });

  for (const view of rewardViews) {
    const visiblePropertyIds = (view.fields! as any).visiblePropertyIds as string[];
    if (!visiblePropertyIds.includes('__rewardAmount')) {
      const fields = view.fields as any;
      fields.columnWidths['__rewardAmount'] = 150;
      fields.columnWidths['__rewardChain'] = 150;
      fields.visiblePropertyIds.push('__rewardAmount');
      fields.visiblePropertyIds.push('__rewardChain');
      await prisma.rewardBlock.update({
        where: {
          id_spaceId: {
            id: view.id,
            spaceId: view.spaceId
          }
        },
        data: {
          fields
        }
      });
      console.log('updated view', view.id);
    }
  }

  //console.log(rewardViews.length);
}

migrateAllProposalDatabases().then(() => console.log('done'));
