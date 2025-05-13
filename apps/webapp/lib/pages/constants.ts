import type { PageType } from '@charmverse/core/prisma-client';

export const lockablePageTypes: PageType[] = [
  'page',
  'page_template',
  'board',
  'board_template',
  'linked_board',
  'card',
  'card_template',
  'card_synced',
  'bounty',
  'bounty_template'
];
