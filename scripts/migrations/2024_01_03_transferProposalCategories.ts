import { prisma } from '@charmverse/core/prisma-client';
import { getDefaultBoard, getDefaultTableView } from 'components/proposals/components/ProposalsBoard/utils/boardData';
import { Block, blockToPrisma } from 'lib/focalboard/block';
import { IPropertyTemplate } from 'lib/focalboard/board';
import { BoardView } from 'lib/focalboard/boardView';
import { DEFAULT_BOARD_BLOCK_ID, DEFAULT_VIEW_BLOCK_ID } from 'lib/proposal/blocks/constants';
import { ProposalBoardBlock } from 'lib/proposal/blocks/interfaces';
import { ProposalFields } from 'lib/proposal/interface';
import { v4 } from 'uuid';

async function transferProposalCategories() {
  const spaces = await prisma.space.findMany({
    select: {
      proposals: {
        select: {
          id: true,
          categoryId: true,
          fields: true
        }
      },
      createdAt: true,
      createdBy: true,
      proposalBlocks: true,
      domain: true,
      name: true,
      id: true,
      proposalCategories: {
        select: {
          id: true,
          color: true,
          title: true
        }
      }
    }
  });

  const totalSpaces = spaces.length;
  let currentSpace = 0;

  for (const space of spaces) {
    const { id: spaceId, proposals, createdAt, createdBy, proposalCategories, proposalBlocks } = space;
    if (proposals.length === 0) {
      continue;
    }
    if (proposals.every((proposal) => !proposal.categoryId)) {
      console.log('new space exists without proposal categories', { spaceId, createdAt, domain: space.domain });
      continue;
    }
    try {
      const proposalBoardBlock = (proposalBlocks.find((block) => block.id === DEFAULT_BOARD_BLOCK_ID) ??
        getDefaultBoard({
          storedBoard: undefined,
          customOnly: true
        })) as ProposalBoardBlock;

      if (!proposalBoardBlock.spaceId) {
        proposalBoardBlock.rootId = spaceId;
        proposalBoardBlock.createdBy = createdBy;
        proposalBoardBlock.spaceId = spaceId;
        proposalBoardBlock.updatedBy = createdBy;
      }

      const newCategorySelectProperty: IPropertyTemplate = {
        id: v4(),
        name: 'Category',
        options: proposalCategories.map((category) => ({
          color: category.color,
          id: category.id,
          value: category.title
        })),
        type: 'select'
      };
      if (proposalBoardBlock.fields.cardProperties.find((property) => property.name === 'Category')) {
        console.warn('Space already has a category property', {
          title: space.name,
          id: space.id,
          domain: space.domain
        });
        continue;
      }
      proposalBoardBlock.fields.cardProperties.push(newCategorySelectProperty);

      const proposalBoardViewBlock = proposalBlocks.find(
        (block) => block.id === DEFAULT_VIEW_BLOCK_ID
      ) as unknown as BoardView | null;

      if (proposalBoardViewBlock) {
        proposalBoardViewBlock.fields.visiblePropertyIds.splice(2, 0, newCategorySelectProperty.id);
      }

      await prisma.$transaction([
        prisma.proposalBlock.upsert({
          where: {
            id_spaceId: {
              id: proposalBoardBlock.id,
              spaceId
            }
          },
          create: blockToPrisma(proposalBoardBlock as unknown as Block),
          update: {
            fields: proposalBoardBlock.fields
          }
        }),
        ...(proposalBoardViewBlock
          ? [
              prisma.proposalBlock.update({
                where: {
                  id_spaceId: {
                    id: proposalBoardViewBlock.id,
                    spaceId
                  }
                },
                data: {
                  fields: proposalBoardViewBlock.fields
                }
              })
            ]
          : []),
        // prisma.proposalCategory.deleteMany({
        //   where: {
        //     spaceId
        //   }
        // }),
        // prisma.proposalCategoryPermission.deleteMany({
        //   where: {
        //     spaceId
        //   }
        // }),
        ...proposals
          .filter((proposal) => proposal.categoryId)
          .map((proposal) => {
            const fields = proposal.fields as ProposalFields | null;
            return prisma.proposal.update({
              where: {
                id: proposal.id
              },
              data: {
                //categoryId: null,
                fields: {
                  ...fields,
                  properties: {
                    ...(fields || {}).properties,
                    [newCategorySelectProperty.id]: proposal.categoryId
                  }
                }
              }
            });
          })
      ]);
    } catch (_) {
      console.log(_);
      console.error(`Failed to create proposal categories for space ${spaceId}`);
    } finally {
      currentSpace += 1;
      console.log(`Finished space ${currentSpace}/${totalSpaces}`);
    }
  }
}

transferProposalCategories()
  .then(() => {
    console.log('Done!');
  })
  .catch((e) => {
    console.error('Error!', e);
  });
