import { prisma } from 'db';
import { createPage, generateBoard, generateUserAndSpaceWithApiToken } from '../setupDatabase';

describe('generateBoard', () => {
  it('should generate a database page with 1 view and 2 nested cards', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(undefined, false);

    await generateBoard({ createdBy: user.id, spaceId: space.id });

    const pages = await prisma.page.findMany({
      where: {
        spaceId: space.id
      },
      select: {
        id: true
      }
    });

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
