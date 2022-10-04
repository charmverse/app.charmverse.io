import { prisma } from 'db';

import { createPage, generateBoard, generateUserAndSpaceWithApiToken } from '../setupDatabase';

describe('generateBoard', () => {
  it('should generate a database page with 1 view and 2 nested cards by default', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const board = await generateBoard({ createdBy: user.id, spaceId: space.id });

    const pages = await prisma.page.findMany({
      where: {
        spaceId: space.id,
        OR: [{
          id: board.id
        }, {
          parentId: board.id
        }]
      },
      select: {
        id: true,
        parentId: true,
        type: true
      }
    });

    const boardPage = pages.find(page => page.id === board.id && page.type === 'board');
    const cardPages = pages.filter(page => page.parentId === board.id && page.type === 'card');

    const blocks = await prisma.block.findMany({
      where: {
        spaceId: space.id
      }
    });

    const boardBlocks = blocks.filter(b => b.type === 'board');
    const viewBlocks = blocks.filter(b => b.type === 'view');
    const cardBlocks = blocks.filter(b => b.type === 'card');

    // 1 board plus 2 nested cards
    expect(pages.length).toBe(3);

    // Make sure pages created with correct type
    expect(boardPage).toBeTruthy();
    expect(cardPages.length).toBe(2);

    // Ensure blocks provisioned correctly
    expect(boardBlocks.length).toBe(1);

    expect(viewBlocks.length).toBe(1);

    expect(cardBlocks.length).toBe(2);

    // Ensure the board ids and card ids match their respective pages
    expect(pages.some(p => p.id === boardBlocks[0].id)).toBe(true);

    cardBlocks.forEach(card => {
      expect(pages.some(p => p.id === card.id)).toBe(true);
    });
  });

  it('should generate a database page with 1 view and X amount of nested cards', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const cardsToCreate = 10;

    const board = await generateBoard({ createdBy: user.id, spaceId: space.id, cardCount: cardsToCreate });

    const pages = await prisma.page.findMany({
      where: {
        spaceId: space.id,
        OR: [{
          id: board.id
        }, {
          parentId: board.id
        }]
      },
      select: {
        id: true,
        parentId: true,
        type: true
      }
    });

    const boardPage = pages.find(page => page.id === board.id && page.type === 'board');
    const cardPages = pages.filter(page => page.parentId === board.id && page.type === 'card');

    const blocks = await prisma.block.findMany({
      where: {
        spaceId: space.id
      }
    });

    const boardBlocks = blocks.filter(b => b.type === 'board');
    const viewBlocks = blocks.filter(b => b.type === 'view');
    const cardBlocks = blocks.filter(b => b.type === 'card');

    // 1 board plus X nested cards
    expect(pages.length).toBe(cardsToCreate + 1);

    // Make sure pages created with correct type
    expect(boardPage).toBeTruthy();
    expect(cardPages.length).toBe(cardsToCreate);

    // Ensure blocks provisioned correctly
    expect(boardBlocks.length).toBe(1);

    expect(viewBlocks.length).toBe(1);

    expect(cardBlocks.length).toBe(cardsToCreate);

    // Ensure the board ids and card ids match their respective pages
    expect(pages.some(p => p.id === boardBlocks[0].id)).toBe(true);

    cardBlocks.forEach(card => {
      expect(pages.some(p => p.id === card.id)).toBe(true);
    });
  });

  it('should generate a board under another page if this option is passed', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    const board = await generateBoard({
      createdBy: user.id,
      spaceId: space.id,
      parentId: page.id
    });

    expect(board.parentId).toBe(page.id);
  });
});
