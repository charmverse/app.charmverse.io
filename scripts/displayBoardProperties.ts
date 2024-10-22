import { prisma } from '@charmverse/core/prisma-client';
import { BoardFields } from 'lib/databases/board';
import { BoardView } from 'lib/databases/boardView';
import { prettyPrint } from 'lib/utils/strings';

async function displayBoardProperties({ pagePath, spaceDomain }: { spaceDomain: string; pagePath: string }) {
  const page = await prisma.page.findFirstOrThrow({
    where: {
      path: pagePath,
      type: 'board',
      space: {
        domain: spaceDomain
      }
    },
    select: {
      id: true,
      boardId: true
    }
  });

  const boardBlock = await prisma.block.findUniqueOrThrow({
    where: {
      id: page.boardId as string
    }
  });

  const viewBlocks = (await prisma.block.findMany({
    where: {
      type: 'view',
      rootId: boardBlock.id
    }
  })) as any as BoardView[];

  const boardProps = (boardBlock.fields as any as BoardFields).cardProperties.map((propSchema) => {
    const baseProp = {
      id: propSchema.id,
      name: propSchema.name,
      type: propSchema.type,
      options: propSchema.options?.map((opt) => opt.value),
      visibleInViews: viewBlocks
        .filter(
          (block) => !block.fields.visiblePropertyIds?.length || block.fields.visiblePropertyIds.includes(propSchema.id)
        )
        .map((v) => ({ id: v.id, name: v.title }))
    };

    return baseProp;
  });

  prettyPrint(boardProps);
}

displayBoardProperties({
  spaceDomain: 'op-grants',
  pagePath: 'pm-database-5669360764903537'
}).then();
