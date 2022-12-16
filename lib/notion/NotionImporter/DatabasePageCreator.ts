import { v4 } from 'uuid';

import { prisma } from 'db';
import { createBoard } from 'lib/focalboard/board';
import { createBoardView } from 'lib/focalboard/boardView';

import { convertToPlainText } from '../convertToPlainText';
import { createPrismaPage } from '../createPrismaPage';
import { getPersistentImageUrl } from '../getPersistentImageUrl';
import type { GetDatabaseResponse } from '../types';

import type { DatabasePageItem, NotionCache } from './NotionCache';
import type { NotionPageFetcher } from './NotionPageFetcher';

export class DatabasePageCreator {
  pageIds: string[];

  notionPageId: string;

  spaceId: string;

  userId: string;

  cache: NotionCache;

  fetcher: NotionPageFetcher;

  charmversePageId: string;

  constructor({
    pageIds,
    notionPageId,
    spaceId,
    cache,
    userId,
    fetcher
  }: {
    pageIds: string[];
    notionPageId: string;
    spaceId: string;
    userId: string;
    cache: NotionCache;
    fetcher: NotionPageFetcher;
  }) {
    this.cache = cache;
    this.fetcher = fetcher;
    this.spaceId = spaceId;
    this.userId = userId;
    this.pageIds = pageIds;
    this.notionPageId = notionPageId;
    this.charmversePageId = v4();
  }

  async create() {
    const pageRecord = this.cache.pagesRecord.get(this.notionPageId) as DatabasePageItem;
    if (!pageRecord?.charmversePage) {
      const notionPage = this.cache.notionPagesRecord[this.notionPageId] as GetDatabaseResponse;
      const notionPageTitle = convertToPlainText(notionPage.title);
      const parentPage =
        notionPage.parent.type !== 'workspace'
          ? await this.fetcher.fetchAndCreatePage({
              notionPageId: notionPage.parent.page_id
            })
          : null;

      const parentId = parentPage?.id ?? this.fetcher.workspacePageId;
      const board = createBoard();
      const headerImageUrl = notionPage.cover
        ? await getPersistentImageUrl({ image: notionPage.cover, spaceId: this.spaceId })
        : null;

      board.id = this.charmversePageId;
      board.title = notionPageTitle;
      board.fields.icon = notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '';
      board.fields.headerImage = headerImageUrl;
      board.rootId = board.id;
      board.fields.cardProperties = pageRecord.notionPage ? Object.values(pageRecord.notionPage.properties) : [];
      const view = createBoardView();
      view.fields.viewType = 'board';
      view.parentId = board.id;
      view.rootId = board.rootId;
      view.title = 'Board view';

      const commonBlockData = {
        spaceId: this.spaceId,
        createdBy: this.userId,
        updatedBy: this.userId,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Optimistically create the page
      const createdCharmversePage = await createPrismaPage({
        id: this.charmversePageId,
        headerImage: headerImageUrl,
        icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '',
        spaceId: this.spaceId,
        type: 'board',
        createdBy: this.userId,
        title: notionPageTitle,
        parentId,
        boardId: board.id
      });

      await prisma.block.createMany({
        data: [
          {
            ...view,
            ...commonBlockData
          },
          {
            ...board,
            ...commonBlockData
          }
        ]
      });

      this.cache.pagesRecord.set(this.notionPageId, {
        ...pageRecord,
        type: 'database',
        charmversePage: createdCharmversePage
      });

      const pageRecordProperties = pageRecord.notionPage?.properties;
      const pageIds = pageRecord.notionPage?.pageIds ?? [];
      for (const pageId of pageIds) {
        await this.fetcher.fetchAndCreatePage({
          notionPageId: pageId,
          properties: pageRecordProperties
        });
      }

      return createdCharmversePage;
    } else {
      return pageRecord.charmversePage;
    }
  }
}
