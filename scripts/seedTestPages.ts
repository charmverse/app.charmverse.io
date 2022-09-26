import { generateBoard } from 'testing/setupDatabase'
import { boardWithCardsArgs } from 'testing/generate-board-stub';
import { pageStubToCreate } from 'testing/generate-page-stub';
import {prisma} from 'db'
import { DataNotFoundError } from 'lib/utilities/errors'
import { Prisma } from '@prisma/client';

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

  const pageInputs: Prisma.PageCreateInput[] = [];

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

  await prisma.$transaction(pageInputs.map(page => prisma.page.create({data: page})))

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
    const { pageArgs, blockArgs } = boardWithCardsArgs({ createdBy: space?.createdBy, spaceId: space.id, cardCount });
    pageCreateArgs.push(...pageArgs);
    blockCreateArgs.push(blockArgs);
  }

  await prisma.$transaction([
    ...pageCreateArgs.map(p => prisma.page.create(p)),
    ...blockCreateArgs.map(b => prisma.block.createMany(b)) 
  ]);

  console.log('Created:')
  console.log(blockCreateArgs.length, ' boards')
  console.log(pageCreateArgs.length - blockCreateArgs.length, ' cards')

}

