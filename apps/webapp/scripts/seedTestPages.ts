import type { Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { createPage } from '@packages/pages/createPage';
import { generateFirstDiff } from '@packages/pages/generateFirstDiff';
import { DataNotFoundError } from '@packages/utils/errors';
import { boardWithCardsArgs } from '@packages/testing/generateBoardStub';
import { pageStubToCreate } from '@packages/testing/generatePageStub';

type PageSeedInput = {
  page: Prisma.PageCreateManyInput;
  permissions: Prisma.PagePermissionCreateManyInput[];
  diffs: Prisma.PageDiffCreateManyInput[];
};

const defaultBatchSize = 1000;

/**
 * See this doc for usage instructions
 * https://app.charmverse.io/charmverse/page-8095374127900168
 *
 * @perBatch Default 1000. Prisma chokes if creating too many pages. This allows you to tweak how the job will be split.
 *
 * @nestedPercent The percentage of pages that should have a parent. This is a number between 0 and 100. Defaults to 30
 */
export async function seedTestPages({
  spaceDomain,
  nestedPercent = 50,
  pagesToCreate,
  createDiffs,
  perBatch = defaultBatchSize
}: {
  spaceDomain: string;
  pagesToCreate: number;
  nestedPercent?: number;
  createDiffs?: boolean;
  perBatch?: number;
}) {
  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`);
  }

  const seedInputs: PageSeedInput[] = [];

  for (let pageCount = 0; pageCount < pagesToCreate; pageCount++) {
    const page = pageStubToCreate({ spaceId: space.id, createdBy: space.createdBy, title: `Page ${pageCount + 1}` });

    const assignParent = Math.random() * 100 < nestedPercent;

    if (seedInputs.length > 0 && assignParent) {
      // Get a random page
      const parentPage = seedInputs[Math.floor(Math.random() * seedInputs.length)];

      page.parentId = parentPage.page.id;
    }

    const permissionInputs: Prisma.PagePermissionCreateManyInput[] = [
      {
        pageId: page.id as string,
        spaceId: space.id,
        permissionLevel: 'full_access'
      },
      {
        pageId: page.id as string,
        userId: space.createdBy,
        permissionLevel: 'full_access'
      }
    ];

    const diffs: Prisma.PageDiffCreateManyInput[] = [];

    if (createDiffs) {
      const diff = generateFirstDiff({
        createdBy: page.createdBy,
        content: page.content
      });
      diffs.push({
        ...diff,
        pageId: page.id
      } as Prisma.PageDiffCreateManyInput);
    }

    seedInputs.push({
      page,
      diffs,
      permissions: permissionInputs
    });
  }

  console.log('Pages to create', seedInputs.length, 'Permissions to create', seedInputs.length * 2);

  const totalPages = seedInputs.length;

  await prisma.$transaction(
    async (tx) => {
      for (let i = 0; i < totalPages; i += perBatch) {
        console.log(`Processing pages ${i + 1} - ${i + perBatch} / ${totalPages}`);

        const toProcess = seedInputs.slice(i, i + perBatch);
        await tx.page.createMany({
          data: toProcess.map((seed) => seed.page)
        }),
          await tx.pagePermission.createMany({
            data: toProcess.flatMap((seed) => seed.permissions)
          });

        if (createDiffs) {
          await tx.pageDiff.createMany({
            data: toProcess.flatMap((seed) => seed.diffs)
          });
        }
      }

      // Long 10 minute timeout to leave space for generating data
    },
    { timeout: 600000 }
  );

  console.log('Created ', totalPages, ' pages');
}

export async function seedTestBoards({
  spaceDomain,
  boardCount = 1,
  cardCount,
  boardTitle
}: {
  spaceDomain: string;
  boardCount?: number;
  cardCount?: number;
  boardTitle?: string;
}) {
  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`);
  }

  const pageCreateArgs: Prisma.PageCreateArgs[] = [];
  const blockCreateArgs: Prisma.BlockCreateManyArgs[] = [];

  for (let i = 0; i < boardCount; i++) {
    const { pageArgs, blockArgs } = boardWithCardsArgs({
      createdBy: space?.createdBy,
      spaceId: space.id,
      cardCount,
      addPageContent: true,
      boardTitle: boardTitle ? `Board ${i + 1}` : undefined
    });
    pageCreateArgs.push(...pageArgs);
    blockCreateArgs.push(blockArgs);
  }

  const permissionInputs: Prisma.PagePermissionCreateManyInput[] = pageCreateArgs.map((p) => ({
    pageId: p.data.id as string,
    spaceId: space.id,
    permissionLevel: 'full_access'
  }));

  await prisma.$transaction([
    ...pageCreateArgs.map((p) => createPage(p)),
    prisma.pagePermission.createMany({
      data: permissionInputs
    }),
    ...blockCreateArgs.map((b) => prisma.block.createMany(b))
  ]);

  console.log('Created:');
  console.log(blockCreateArgs.length, ' boards');
  console.log(pageCreateArgs.length - blockCreateArgs.length, ' cards');
}

async function cleanSpacePages({ spaceDomain }: { spaceDomain: string }) {
  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  });

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`);
  }

  await prisma.$transaction([
    prisma.page.deleteMany({
      where: {
        spaceId: space.id
      }
    }),
    prisma.block.deleteMany({
      where: {
        spaceId: space.id
      }
    })
  ]);
}

// cleanSpacePages({spaceDomain: 'mushy-beige-angelfish'})
//   .then(() => console.log('Done'))
// .catch(e => {
//   console.error(e)
//   process.exit(1)
// })

seedTestBoards({ spaceDomain: 'mushy-beige-angelfish', boardCount: 50, cardCount: 40, boardTitle: 'Board' })
  .then(() => console.log('Done'))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });

// seedTestPages({ spaceDomain: 'gross-blush-vicuna', pagesToCreate: 10000, nestedPercent: 92 })
//   .then(() => {
//     console.log('Done');
//     process.exit(0);
//   })
//   .catch((e) => {
//     console.error(e);
//     process.exit(1);
//   });
