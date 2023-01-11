import { generateBoard } from 'testing/setupDatabase'
import { boardWithCardsArgs } from 'testing/generateBoardStub';
import { pageStubToCreate } from 'testing/generatePageStub';
import {prisma} from 'db'
import { DataNotFoundError } from 'lib/utilities/errors'
import { Prisma } from '@prisma/client';
import { createPage } from 'lib/pages/server/createPage';

/**
 * @nestedPercent The percentage of pages that should have a parent. This is a number between 0 and 100. Defaults to 30
 */
export async function seedTestPages({spaceDomain, nestedPercent = 50, pagesToCreate}: {spaceDomain: string, pagesToCreate: number, nestedPercent?: number }) {
  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  })

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`)
  }

  const pageInputs: Prisma.PageCreateManyInput[] = [];

  for (let pageCount = 0; pageCount < pagesToCreate; pageCount++) {
    const page = pageStubToCreate({spaceId: space.id, createdBy: space.createdBy, title: `Page ${pageCount + 1}`})

    const assignParent = (Math.random() * 100) < nestedPercent;

    if (pageInputs.length > 0 && assignParent) {
      // Get a random page
      const parentPage = pageInputs[Math.floor(Math.random() * pageInputs.length)]

      page.parentId = parentPage.id
    }

    pageInputs.push(page)
  }

  const permissionInputs: Prisma.PagePermissionCreateManyInput[] = pageInputs.map(p => ({
    pageId: p.id as string,
    spaceId: space.id,
    permissionLevel: 'full_access'
  }))

  console.log('Pages to create', pageInputs.length)

  pageInputs.forEach(i => {
    permissionInputs.push({
      pageId: i.id as string,
      userId: space.createdBy,
      permissionLevel: 'full_access'
    })
  })

  console.log('Permission inputs', permissionInputs.length);

  await prisma.$transaction([
    prisma.page.createMany({
      data: pageInputs
    }),
    prisma.pagePermission.createMany({
      data: permissionInputs
    })
  ])

  console.log('Created ', pageInputs.length, ' pages')

}

export async function seedTestBoards({spaceDomain, boardCount = 1, cardCount}: {spaceDomain: string, boardCount?: number, cardCount?: number}) {

  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  })

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`)
  }

  const pageCreateArgs: Prisma.PageCreateArgs[] = [];
  const blockCreateArgs: Prisma.BlockCreateManyArgs[] = [];

  for (let i = 0; i < boardCount; i++) {
    const { pageArgs, blockArgs } = boardWithCardsArgs({ createdBy: space?.createdBy, spaceId: space.id, cardCount, addPageContent: true })
    pageCreateArgs.push(...pageArgs);
    blockCreateArgs.push(blockArgs);
  }

  const permissionInputs: Prisma.PagePermissionCreateManyInput[] = pageCreateArgs.map(p => ({
    pageId: p.data.id as string,
    spaceId: space.id,
    permissionLevel: 'full_access'
  }))

  await prisma.$transaction([
    ...pageCreateArgs.map(p => createPage(p)),
    prisma.pagePermission.createMany({
      data: permissionInputs
    }),
    ...blockCreateArgs.map(b => prisma.block.createMany(b))
  ]);

  console.log('Created:')
  console.log(blockCreateArgs.length, ' boards')
  console.log(pageCreateArgs.length - blockCreateArgs.length, ' cards')

}

async function cleanSpacePages({spaceDomain}: {spaceDomain: string}) {
  const space = await prisma.space.findUnique({
    where: {
      domain: spaceDomain
    }
  })

  if (!space) {
    throw new DataNotFoundError(`Space with domain ${spaceDomain} not found`)
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
  ])
}

// cleanSpacePages({spaceDomain: 'slim-ivory-tyrannosaurus'})
//   .then(() => console.log('Done'))
// .catch(e => {
//   console.error(e)
//   process.exit(1)
// })

// seedTestBoards({spaceDomain: 'maximum-fuchsia-cicada', boardCount: 1, cardCount: 500})
//   .then(() => console.log('Done'))
// .catch(e => {
//   console.error(e)
//   process.exit(1)
// })


seedTestPages({spaceDomain: 'prospective-decentralized-hummingbird', pagesToCreate: 15000, nestedPercent: 92})
.then(() => {
  console.log('Done')
  process.exit(0)
})
.catch(e => {
  console.error(e)
  process.exit(1)
})

