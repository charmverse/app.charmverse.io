import { prisma } from '@charmverse/core/prisma-client';
import type { PageObjectResponse } from '@notionhq/client/build/src/api-endpoints';
import { blockToPrisma } from '@packages/databases/block';
import { createCard } from '@packages/databases/card';
import type { PageContent } from 'lib/prosemirror/interfaces';
import { v4 } from 'uuid';

import { convertToPlainText } from '../convertToPlainText';
import { createPrismaPage } from '../createPrismaPage';
import { getPersistentImageUrl } from '../getPersistentImageUrl';
import type { BlocksRecord } from '../interfaces';

import { NotionBlock } from './NotionBlock';
import type { DatabasePageItem, NotionCache, RegularPageItem } from './NotionCache';
import type { NotionPage } from './NotionPage';

export class CharmversePage {
  blocksRecord: BlocksRecord;

  topLevelBlockIds: string[];

  notionPageId: string;

  cache: NotionCache;

  notionPage: NotionPage;

  charmversePageId: string;

  constructor({
    blocksRecord,
    topLevelBlockIds,
    notionPageId,
    cache,
    notionPage
  }: {
    blocksRecord: BlocksRecord;
    topLevelBlockIds: string[];
    notionPageId: string;
    cache: NotionCache;
    notionPage: NotionPage;
  }) {
    this.cache = cache;
    this.notionPage = notionPage;
    this.blocksRecord = blocksRecord;
    this.topLevelBlockIds = topLevelBlockIds;
    this.notionPageId = notionPageId;
    this.charmversePageId = v4();
  }

  async create() {
    const pageRecord = this.cache.pagesRecord.get(this.notionPageId) as RegularPageItem;
    const notionPage = this.cache.notionPagesRecord[this.notionPageId] as PageObjectResponse;
    const notionParentPageId =
      notionPage.parent.type === 'database_id'
        ? notionPage.parent.database_id
        : notionPage.parent.type === 'page_id'
          ? notionPage.parent.page_id
          : notionPage.parent.type === 'block_id'
            ? (this.cache.blockPageIdRecord.get(notionPage.parent.block_id) ?? null)
            : null;
    const charmverseParentPage = notionParentPageId
      ? await this.notionPage.fetchAndCreatePage({
          notionPageId: notionParentPageId
        })
      : null;
    const charmverseParentPageId = charmverseParentPage?.id ?? this.notionPage.workspacePageId;
    if (!pageRecord?.charmversePage) {
      const notionPageTitleProperty = Object.values(notionPage.properties).find(
        (property) => property.type === 'title'
      );

      const notionPageTitle =
        notionPageTitleProperty?.type === 'title' ? convertToPlainText(notionPageTitleProperty.title) : '';

      const properties =
        notionParentPageId !== null
          ? (this.cache.pagesRecord.get(notionParentPageId) as DatabasePageItem)?.notionPage?.properties
          : null;
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
          ? await getPersistentImageUrl({ image: notionPage.cover, spaceId: this.notionPage.spaceId })
          : null;

        await prisma.block.create({
          data: blockToPrisma({
            parentId: '',
            ...createCard({
              title: notionPageTitle,
              id: this.charmversePageId,
              parentId: charmverseParentPageId,
              rootId: charmverseParentPageId,
              fields: {
                icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '',
                contentOrder: [],
                headerImage,
                properties: cardProperties
              },
              deletedAt: null,
              spaceId: this.notionPage.spaceId,
              createdBy: this.notionPage.userId,
              updatedBy: this.notionPage.userId
            }),
            createdAt: new Date().getTime(),
            updatedAt: new Date().getTime()
          })
        });
      }

      const headerImageUrl = notionPage.cover
        ? await getPersistentImageUrl({ image: notionPage.cover, spaceId: this.notionPage.spaceId })
        : null;

      // Optimistically create the page
      const createdCharmversePage = await createPrismaPage({
        id: this.charmversePageId,
        headerImage: headerImageUrl,
        spaceId: this.notionPage.spaceId,
        createdBy: this.notionPage.userId,
        title: notionPageTitle,
        icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '',
        parentId: charmverseParentPageId,
        type: notionPage.parent.type === 'database_id' ? 'card' : 'page',
        cardId: notionPage.parent.type === 'database_id' ? this.charmversePageId : undefined
      });

      this.cache.incrementCreatedPagesCounter();

      this.cache.pagesRecord.set(this.notionPageId, {
        ...pageRecord,
        charmversePage: createdCharmversePage
      });

      const notionBlock = new NotionBlock({
        charmversePage: this,
        notionPage: this.notionPage,
        blocksRecord: this.blocksRecord
      });

      const convertedBlocks = await notionBlock.convertBlocks(this.topLevelBlockIds);

      const pageContent: PageContent = {
        type: 'doc',
        content: convertedBlocks
      };

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
