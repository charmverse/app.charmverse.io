import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { PageContent } from 'models';

async function main () {
  const cardBlocks = await prisma.block.findMany({
    where: {
      type: 'card'
    },
    select: {
      id: true,
      createdBy: true,
      updatedBy: true,
      spaceId: true,
      fields: true,
      parentId: true,
      createdAt: true,
      updatedAt: true,
      title: true
    }
  });

  const charmTextBlockIdsToDelete: Array<string> = [];
  const cardBlockIds = new Set(cardBlocks.map(cardBlock => cardBlock.id));
  const cardPages = await prisma.page.findMany({
    where: {
      id: {
        in: Array.from(cardBlockIds)
      }
    },
    select: {
      id: true
    }
  });
  let createdCardPages = 0;
  let updatedCardPages = 0;
  const cardPageIds = new Set(cardPages.map(cardPage => cardPage.id));

  const charmTextBlocks = await prisma.block.findMany({
    where: {
      parentId: {
        in: Array.from(cardBlockIds)
      }
    },
    select: {
      fields: true,
      id: true,
      parentId: true
    }
  });

  const cardBlockCharmTextRecord: Record<string, {
    id: string;
    fields: Prisma.JsonValue;
    parentId: string;
  }> = {};

  charmTextBlocks.forEach(charmTextBlock => {
    cardBlockCharmTextRecord[charmTextBlock.parentId] = charmTextBlock;
  });

  for (const cardBlock of cardBlocks) {
    const cardPage = cardPageIds.has(cardBlock.id);
    const charmTextBlock = cardBlockCharmTextRecord[cardBlock.id];
    if (!cardPage) {
      const cardPageInput: Prisma.PageCreateInput = {
        author: {
          connect: {
            id: cardBlock.createdBy
          }
        },
        updatedBy: cardBlock.updatedBy,
        id: cardBlock.id,
        space: {
          connect: {
            id: cardBlock.spaceId
          }
        },
        permissions: {
          create: [
            {
              permissionLevel: 'full_access',
              spaceId: cardBlock.spaceId
            }
          ]
        },
        card: {
          connect: {
            id: cardBlock.id
          }
        },
        createdAt: cardBlock.createdAt,
        path: `page-${Math.random().toString().replace('0.', '')}`,
        title: cardBlock.title,
        icon: (cardBlock.fields as any)?.icon,
        type: 'card',
        headerImage: (cardBlock.fields as any)?.headerImage,
        contentText: '',
        parentId: cardBlock.parentId,
        updatedAt: cardBlock.updatedAt,
        content: (charmTextBlock?.fields as any)?.content as PageContent
      };
      await prisma.page.create({
        data: cardPageInput
      });
      createdCardPages += 1;
    }
    else {
      const cardPageInput: Prisma.PageUpdateInput = {
        title: cardBlock.title,
        icon: (cardBlock.fields as any)?.icon,
        type: 'card',
        headerImage: (cardBlock.fields as any)?.headerImage,
        content: (charmTextBlock?.fields as any)?.content as PageContent
      };
      await prisma.page.update({
        data: cardPageInput,
        where: {
          id: cardBlock.id
        }
      });
      updatedCardPages += 1;
    }
    if (charmTextBlock) {
      charmTextBlockIdsToDelete.push(charmTextBlock.id);
    }
  }

  await prisma.block.deleteMany({
    where: {
      id: {
        in: charmTextBlockIdsToDelete
      }
    }
  });

  console.log(`Deleted charm_text blocks: ${charmTextBlockIdsToDelete.length}`);
  console.log(`Created card pages: ${createdCardPages}`);
  console.log(`Updated card pages: ${updatedCardPages}`);
}

main();
