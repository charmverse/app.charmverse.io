import type { PageType } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';

import type { PageCounts } from '../countSpacePages';
import { countSpacePages } from '../countSpacePages'; // Adjust the import path accordingly

describe('countSpacePages', () => {
  it('should count all page types', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const pageTypes: PageType[] = [
      // 2 doc types
      'page',
      'page_template',
      // 2 reward types
      'bounty',
      'bounty_template',
      // 2 proposal types
      'proposal',
      'proposal_template',
      // 5 database types
      'board',
      'board_template',
      'linked_board',
      'inline_board',
      'inline_linked_board',
      // 2 card types
      'card',
      'card_template'
    ];

    // Generate pages of different types
    for (const pageType of pageTypes) {
      await testUtilsPages.generatePage({ spaceId: space.id, createdBy: user.id, type: pageType });
    }

    const count = await countSpacePages({ spaceId: space.id });

    expect(count).toMatchObject<PageCounts>({
      total: pageTypes.length,
      details: {
        documents: 2,
        rewards: 2,
        proposals: 2,
        databases: 5,
        cards: 2
      }
    });
  });

  it('should ignore deleted pages', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();

    const pageTypes: PageType[] = [
      // 2 doc types
      'page',
      'page_template',
      // 2 reward types
      'bounty',
      'bounty_template',
      // 2 proposal types
      'proposal',
      'proposal_template',
      // 5 database types
      'board',
      'board_template',
      'linked_board',
      'inline_board',
      'inline_linked_board',
      // 2 card types
      'card',
      'card_template'
    ];

    // Generate pages of different types
    for (const pageType of pageTypes) {
      await testUtilsPages.generatePage({
        spaceId: space.id,
        createdBy: user.id,
        type: pageType,
        deletedAt: new Date()
      });
    }

    const count = await countSpacePages({ spaceId: space.id });

    expect(count).toMatchObject<PageCounts>({
      total: 0,
      details: {
        documents: 0,
        rewards: 0,
        proposals: 0,
        databases: 0,
        cards: 0
      }
    });
  });
});
