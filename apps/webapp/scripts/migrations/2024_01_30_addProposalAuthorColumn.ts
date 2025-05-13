import { prisma } from '@charmverse/core/prisma-client';
import { BoardFields, IPropertyTemplate } from '@packages/databases/board';
import { BoardViewFields } from '@packages/databases/boardView';
import { Constants } from '@packages/databases/constants';
import { proposalDbProperties } from '@packages/databases/proposalDbProperties';

async function addProposalAuthorColumn() {
  const proposalBoardBlocks = await prisma.block.findMany({
    where: {
      type: 'board',
      fields: {
        path: ['sourceType'],
        equals: 'proposals'
      }
    },
    select: {
      id: true,
      fields: true
    }
  });

  const totalBoardBlocks = proposalBoardBlocks.length;
  let currentBlock = 0;

  for (const proposalBoardBlock of proposalBoardBlocks) {
    try {
      let proposalAuthorProperty = (proposalBoardBlock.fields as unknown as BoardFields).cardProperties?.find(
        (boardCardProperty) => {
          return boardCardProperty.type === 'proposalAuthor';
        }
      ) as IPropertyTemplate;

      const transactions: any[] = [];

      if (!proposalAuthorProperty) {
        proposalAuthorProperty = proposalDbProperties.proposalAuthor();

        transactions.push(
          prisma.block.update({
            where: {
              id: proposalBoardBlock.id
            },
            data: {
              fields: {
                ...(proposalBoardBlock.fields as unknown as BoardFields),
                cardProperties: [
                  proposalAuthorProperty,
                  ...((proposalBoardBlock.fields as unknown as BoardFields).cardProperties || [])
                ]
              } as any
            }
          })
        );
      }

      const viewBlocks = await prisma.block.findMany({
        where: {
          type: 'view',
          parentId: proposalBoardBlock.id
        },
        select: {
          id: true,
          fields: true
        }
      });

      await prisma.$transaction([
        ...transactions,
        ...viewBlocks.map((viewBlock) => {
          const viewBlockFields = viewBlock.fields as unknown as BoardViewFields;
          const hasTitleProperty = viewBlockFields.visiblePropertyIds.includes(Constants.titleColumnId);

          const viewBlockVisiblePropertyIds =
            viewBlockFields.visiblePropertyIds.filter(
              (visiblePropertyId) => visiblePropertyId !== proposalAuthorProperty.id
            ) || [];

          viewBlockVisiblePropertyIds.splice(hasTitleProperty ? 1 : 0, 0, proposalAuthorProperty.id);

          return prisma.block.update({
            where: {
              id: viewBlock.id
            },
            data: {
              fields: {
                ...(viewBlock.fields as unknown as BoardViewFields),
                visiblePropertyIds: viewBlockVisiblePropertyIds
              }
            }
          });
        })
      ]);
    } catch (_) {
      console.log(`Failed to update board block ${proposalBoardBlock.id}`);
    } finally {
      currentBlock++;
      console.log(`Updated ${currentBlock} of ${totalBoardBlocks} board blocks`);
    }
  }
}

addProposalAuthorColumn();
