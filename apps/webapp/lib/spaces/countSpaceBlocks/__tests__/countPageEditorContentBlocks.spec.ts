import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { countBlocks } from 'lib/prosemirror/countBlocks';

import { countPageEditorContentBlocks } from '../countPageEditorContentBlocks';

describe('countPageEditorContentBlocks', () => {
  it('should return the correct total count of content blocks', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    // Generate some pages with content blocks
    const pages = await Promise.all([
      testUtilsPages.generatePage({
        spaceId: space.id,
        createdBy: space.createdBy,
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Hello world!' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Hello again!' }] }
          ]
        }
      }),
      testUtilsPages.generatePage({
        spaceId: space.id,
        createdBy: space.createdBy,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world!' }] }]
        }
      }),
      testUtilsPages.generatePage({
        spaceId: space.id,
        createdBy: space.createdBy,
        content: {
          type: 'doc',
          content: []
        }
      })
    ]);

    // Count blocks manually for comparison
    const firstPageBlocksCount = countBlocks(pages[0].content, { pageId: pages[0].id, spaceId: space.id });
    const secondPageBlocksCount = countBlocks(pages[1].content, { pageId: pages[1].id, spaceId: space.id });
    const thirdPageBlocksCount = countBlocks(pages[2].content, { pageId: pages[2].id, spaceId: space.id });

    expect(firstPageBlocksCount).toBe(2);
    expect(secondPageBlocksCount).toBe(1);
    expect(thirdPageBlocksCount).toBe(0);

    const countedBlockCount = await countPageEditorContentBlocks({ spaceId: space.id });

    // Check that the manually counted total matches the total returned by the function
    expect(countedBlockCount).toBe(firstPageBlocksCount + secondPageBlocksCount);
  });

  it('should ignore content from deleted pages', async () => {
    const { space } = await testUtilsUser.generateUserAndSpace();

    // Generate some pages with content blocks
    const pages = await Promise.all([
      testUtilsPages.generatePage({
        spaceId: space.id,
        createdBy: space.createdBy,
        content: {
          type: 'doc',
          content: [
            { type: 'paragraph', content: [{ type: 'text', text: 'Hello world!' }] },
            { type: 'paragraph', content: [{ type: 'text', text: 'Hello again!' }] }
          ]
        }
      }),
      testUtilsPages.generatePage({
        spaceId: space.id,
        createdBy: space.createdBy,
        content: {
          type: 'doc',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Hello world!' }] }]
        }
      }),
      testUtilsPages.generatePage({
        spaceId: space.id,
        createdBy: space.createdBy,
        content: {
          type: 'doc',
          content: []
        }
      }),
      testUtilsPages.generatePage({
        spaceId: space.id,
        deletedAt: new Date(),
        createdBy: space.createdBy,
        content: {
          type: 'doc',
          content: []
        }
      })
    ]);

    // Count blocks manually for comparison
    const firstPageBlocksCount = countBlocks(pages[0].content, { pageId: pages[0].id, spaceId: space.id });
    const secondPageBlocksCount = countBlocks(pages[1].content, { pageId: pages[1].id, spaceId: space.id });
    const thirdPageBlocksCount = countBlocks(pages[2].content, { pageId: pages[2].id, spaceId: space.id });

    expect(firstPageBlocksCount).toBe(2);
    expect(secondPageBlocksCount).toBe(1);
    expect(thirdPageBlocksCount).toBe(0);

    const countedBlockCount = await countPageEditorContentBlocks({ spaceId: space.id });

    // Check that the manually counted total matches the total returned by the function
    expect(countedBlockCount).toBe(firstPageBlocksCount + secondPageBlocksCount);
  });
});
