import { v4 } from 'uuid';

import { prisma } from 'db';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createCard } from 'lib/focalboard/card';
import type { PageContent } from 'models';

import { convertToPlainText } from '../convertToPlainText';
import { createPrismaPage } from '../createPrismaPage';
import { getPersistentImageUrl } from '../getPersistentImageUrl';
import type { BlocksRecord, GetPageResponse } from '../types';

import { NotionBlock } from './NotionBlock';
import type { NotionCache, RegularPageItem } from './NotionCache';
import type { NotionPageFetcher } from './NotionPageFetcher';

export class CharmversePage {
  blocksRecord: BlocksRecord;

  topLevelBlockIds: string[];

  notionPageId: string;

  cache: NotionCache;

  fetcher: NotionPageFetcher;

  charmversePageId: string;

  constructor({
    blocksRecord,
    topLevelBlockIds,
    notionPageId,
    cache,
    fetcher
  }: {
    blocksRecord: BlocksRecord;
    topLevelBlockIds: string[];
    notionPageId: string;
    cache: NotionCache;
    fetcher: NotionPageFetcher;
  }) {
    this.cache = cache;
    this.fetcher = fetcher;
    this.blocksRecord = blocksRecord;
    this.topLevelBlockIds = topLevelBlockIds;
    this.notionPageId = notionPageId;
    this.charmversePageId = v4();
  }

  async create({ properties }: { properties?: Record<string, IPropertyTemplate> }) {
    const pageContent: PageContent = {
      type: 'doc',
      content: []
    };

    const pageRecord = this.cache.pagesRecord.get(this.notionPageId) as RegularPageItem;
    const notionPage = this.cache.notionPagesRecord[this.notionPageId] as GetPageResponse;
    const parentPage =
      notionPage.parent.type !== 'workspace'
        ? await this.fetcher.fetchAndCreatePage({
            notionPageId:
              notionPage.parent.type === 'database_id' ? notionPage.parent.database_id : notionPage.parent.page_id
          })
        : null;

    const parentId = parentPage?.id ?? this.fetcher.workspacePageId;
    if (!pageRecord?.charmversePage) {
      const notionPageTitleProperty = Object.values(notionPage.properties).find(
        (property) => property.type === 'title'
      );

      const notionPageTitle =
        notionPageTitleProperty?.type === 'title' ? convertToPlainText(notionPageTitleProperty.title) : '';

      if (notionPage.parent.type === 'database_id' && properties) {
        const cardProperties: Record<string, any> = {};

        Object.values(notionPage.properties).forEach((property: any) => {
          if (property[property.type] && properties[property.id]) {
            if (property.type.match(/(email|number|url|checkbox|phone_number)/)) {
              cardProperties[properties[property.id].id] = property[property.type];
            } else if (property.type === 'rich_text') {
              cardProperties[properties[property.id].id] = convertToPlainText(property[property.type]);
            } else if (property.type === 'select') {
              cardProperties[properties[property.id].id] = property[property.type].id;
            } else if (property.type === 'multi_select') {
              cardProperties[properties[property.id].id] = property[property.type].map(
                (multiSelect: { id: string }) => multiSelect.id
              );
            } else if (property.type === 'date') {
              const dateValue: { from?: number; to?: number } = {};
              if (property[property.type].start) {
                dateValue.from = new Date(property[property.type].start).getTime();
              }

              if (property[property.type].end) {
                dateValue.to = new Date(property[property.type].end).getTime();
              }
              cardProperties[properties[property.id].id] = JSON.stringify(dateValue);
            }
          }
        });

        const headerImage = notionPage.cover
          ? await getPersistentImageUrl({ image: notionPage.cover, spaceId: this.fetcher.spaceId })
          : null;

        await prisma.block.create({
          data: {
            ...createCard({
              title: notionPageTitle,
              id: this.charmversePageId,
              parentId,
              rootId: parentId,
              fields: {
                icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '',
                contentOrder: [],
                headerImage,
                properties: cardProperties
              },
              deletedAt: null,
              spaceId: this.fetcher.spaceId,
              createdBy: this.fetcher.userId,
              updatedBy: this.fetcher.userId
            }),
            deletedAt: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
      }

      // Optimistically create the page
      const createdCharmversePage = await createPrismaPage({
        id: this.charmversePageId,
        content: pageContent,
        spaceId: this.fetcher.spaceId,
        createdBy: this.fetcher.userId,
        title: notionPageTitle,
        icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '',
        parentId,
        type: notionPage.parent.type === 'database_id' ? 'card' : 'page',
        cardId: notionPage.parent.type ? this.charmversePageId : undefined
      });

      this.cache.pagesRecord.set(this.notionPageId, {
        ...pageRecord,
        charmversePage: createdCharmversePage
      });

      for (const firstLevelBlockId of this.topLevelBlockIds) {
        const notionBlock = new NotionBlock({
          charmversePage: this
        });

        const charmverseBlock = await notionBlock.convert(this.blocksRecord[firstLevelBlockId]);
        if (charmverseBlock) {
          pageContent.content?.push(charmverseBlock);
        }
      }

      await prisma.page.update({
        where: {
          id: this.charmversePageId
        },
        data: {
          content: pageContent
        }
      });
      return createdCharmversePage;
    } else {
      return pageRecord.charmversePage;
    }
  }
}
