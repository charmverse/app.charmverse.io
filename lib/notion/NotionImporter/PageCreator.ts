import { v4 } from 'uuid';

import {
  MAX_EMBED_WIDTH,
  MIN_EMBED_HEIGHT,
  MIN_EMBED_WIDTH
} from 'components/common/CharmEditor/components/iframe/config';
import { VIDEO_ASPECT_RATIO } from 'components/common/CharmEditor/components/video/videoSpec';
import { prisma } from 'db';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createCard } from 'lib/focalboard/card';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/prosemirror/plugins/image/constants';
import type {
  ColumnBlockNode,
  ColumnLayoutNode,
  DisclosureDetailsNode,
  ListItemNode,
  PageContent,
  TableNode,
  TableRowNode
} from 'models';

import { convertRichText } from '../convertRichText';
import { convertToPlainText } from '../convertToPlainText';
import { createPrismaPage } from '../createPrismaPage';
import { getPersistentImageUrl } from '../getPersistentImageUrl';
import type { BlocksRecord, BlockWithChildren, GetPageResponse, RichTextItemResponse } from '../types';

import type { NotionCache, RegularPageItem } from './NotionCache';
import type { NotionPageFetcher } from './NotionPageFetcher';

export class PageCreator {
  blocksRecord: BlocksRecord;

  topLevelBlockIds: string[];

  notionPageId: string;

  spaceId: string;

  userId: string;

  cache: NotionCache;

  fetcher: NotionPageFetcher;

  charmversePageId: string;

  constructor({
    blocksRecord,
    topLevelBlockIds,
    notionPageId,
    spaceId,
    cache,
    userId,
    fetcher
  }: {
    blocksRecord: BlocksRecord;
    topLevelBlockIds: string[];
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
    this.blocksRecord = blocksRecord;
    this.topLevelBlockIds = topLevelBlockIds;
    this.notionPageId = notionPageId;
    this.charmversePageId = v4();
  }

  async create({
    charmverseParentPageId,
    properties
  }: {
    charmverseParentPageId: string;
    properties?: Record<string, IPropertyTemplate>;
  }) {
    const pageContent: PageContent = {
      type: 'doc',
      content: []
    };

    const pageRecord = this.cache.pagesRecord.get(this.notionPageId) as RegularPageItem;

    if (!pageRecord?.charmversePage) {
      const notionPage = this.cache.notionPagesRecord[this.notionPageId] as GetPageResponse;
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
          ? await getPersistentImageUrl({ image: notionPage.cover, spaceId: this.spaceId })
          : null;

        await prisma.block.create({
          data: {
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
              spaceId: this.spaceId,
              createdBy: this.userId,
              updatedBy: this.userId
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
        spaceId: this.spaceId,
        createdBy: this.userId,
        title: notionPageTitle,
        icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '',
        parentId: charmverseParentPageId,
        type: notionPage.parent.type === 'database_id' ? 'card' : 'page',
        cardId: notionPage.parent.type ? this.charmversePageId : undefined
      });

      for (const firstLevelBlockId of this.topLevelBlockIds) {
        const blockNode = await this.populatePage(this.blocksRecord[firstLevelBlockId]);
        if (blockNode) {
          pageContent.content?.push(blockNode);
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

      this.cache.pagesRecord.set(this.notionPageId, {
        ...pageRecord,
        charmversePage: createdCharmversePage
      });
      return createdCharmversePage;
    } else {
      return pageRecord.charmversePage;
    }
  }

  private async populatePage(block: BlockWithChildren) {
    try {
      switch (block.type) {
        case 'heading_1':
        case 'heading_2':
        case 'heading_3': {
          const level = Number(block.type.split('_')[1]);
          const { contents, inlineLinkedPages } = convertRichText((block as any)[block.type].rich_text);
          const childIds = block.children;
          if (childIds.length !== 0) {
            // Toggle list heading 1
            const disclosureDetailsNode: DisclosureDetailsNode = {
              type: 'disclosureDetails',
              content: [
                {
                  type: 'disclosureSummary',
                  content: [
                    {
                      type: 'heading',
                      attrs: {
                        level
                      },
                      content: contents
                    }
                  ]
                }
              ]
            };

            for (let index = 0; index < childIds.length; index++) {
              const blockNode = (await this.populatePage(this.blocksRecord[childIds[index]])) as any;
              if (blockNode) {
                disclosureDetailsNode.content.push(blockNode);
              }
            }
            return disclosureDetailsNode;
          } else {
            // Regular heading 1
            return {
              type: 'heading',
              attrs: {
                level
              },
              content: contents
            };
          }
          // await createInlinePageLinks(inlineLinkedPages);
        }
        case 'toggle': {
          // TODO: Linked page support
          const { contents, inlineLinkedPages } = convertRichText(block.toggle.rich_text);
          const disclosureDetailsNode: DisclosureDetailsNode = {
            type: 'disclosureDetails',
            content: [
              {
                type: 'disclosureSummary',
                content: [
                  {
                    type: 'paragraph',
                    content: contents
                  }
                ]
              }
            ]
          };

          // await createInlinePageLinks(inlineLinkedPages);
          const childIds = block.children;
          for (let index = 0; index < childIds.length; index++) {
            const blockNode = (await this.populatePage(this.blocksRecord[childIds[index]])) as any;
            if (blockNode) {
              disclosureDetailsNode.content.push(blockNode);
            }
          }
          return disclosureDetailsNode;
        }

        case 'paragraph': {
          const { contents, inlineLinkedPages } = convertRichText(block[block.type].rich_text);
          // await createInlinePageLinks(inlineLinkedPages);

          return {
            type: 'paragraph',
            content: contents
          };
        }

        case 'bulleted_list_item':
        case 'numbered_list_item':
        case 'to_do': {
          let richText: RichTextItemResponse[] = [];

          if (block.type === 'bulleted_list_item') {
            richText = block.bulleted_list_item.rich_text;
          } else if (block.type === 'numbered_list_item') {
            richText = block.numbered_list_item.rich_text;
          } else if (block.type === 'to_do') {
            richText = block.to_do.rich_text;
          }

          const { contents, inlineLinkedPages } = convertRichText(richText);

          const listItemNode: ListItemNode = {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content: contents
              }
            ],
            attrs: {
              todoChecked: block.type === 'to_do' ? block.to_do.checked : null
            }
          };

          // await createInlinePageLinks(inlineLinkedPages);

          const childIds = block.children;
          for (let index = 0; index < childIds.length; index++) {
            const blockNode = (await this.populatePage(this.blocksRecord[childIds[index]])) as any;
            if (blockNode) {
              listItemNode.content.push(blockNode);
            }
          }

          return {
            type: block.type === 'numbered_list_item' ? 'orderedList' : 'bulletList',
            content: [listItemNode]
          };
        }

        case 'callout':
        case 'quote': {
          let richText: RichTextItemResponse[] = [];
          let emoji: string | null = null;
          if (block.type === 'callout') {
            richText = block.callout.rich_text;
            emoji = block.callout.icon?.type === 'emoji' ? block.callout.icon.emoji : null;
          } else if (block.type === 'quote') {
            richText = block.quote.rich_text;
          }
          const { contents, inlineLinkedPages } = convertRichText(richText);
          const calloutNode = {
            type: block.type === 'callout' ? 'blockquote' : ('quote' as any),
            attrs: {
              emoji
            },
            content: [
              {
                type: 'paragraph',
                content: contents
              }
            ]
          };
          // await createInlinePageLinks(inlineLinkedPages);
          const childIds = block.children;
          for (let index = 0; index < childIds.length; index++) {
            const blockNode = (await this.populatePage(this.blocksRecord[childIds[index]])) as any;
            if (blockNode) {
              calloutNode.content.push(blockNode);
            }
          }

          return calloutNode;
        }

        case 'video': {
          return {
            type: 'iframe',
            attrs: {
              src: block.video.type === 'external' ? block.video.external.url : null,
              type: 'video',
              width: (MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2,
              height: (MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2 / VIDEO_ASPECT_RATIO
            }
          };
        }

        case 'embed':
        case 'bookmark': {
          return {
            type: 'iframe',
            attrs: {
              src: block.type === 'bookmark' ? block.bookmark.url : block.embed.url,
              type: 'embed',
              width: MAX_EMBED_WIDTH,
              height: MIN_EMBED_HEIGHT
            }
          };
        }

        case 'divider': {
          return {
            type: 'horizontalRule'
          };
        }

        case 'code': {
          return {
            type: 'codeBlock',
            content: [
              {
                type: 'text',
                text: block.code.rich_text[0].plain_text
              }
            ],
            attrs: {
              language: block.code.language
            }
          };
        }

        case 'image': {
          const persistentUrl = await getPersistentImageUrl({ image: block.image, spaceId: this.spaceId });
          return {
            type: 'image',
            attrs: {
              src: persistentUrl,
              size: (MAX_IMAGE_WIDTH + MIN_IMAGE_WIDTH) / 2,
              aspectRatio: 1
            }
          };
        }

        case 'table': {
          const tableNode: TableNode = {
            type: 'table',
            content: []
          };

          for (let index = 0; index < this.blocksRecord[block.id].children.length; index++) {
            const rowId = this.blocksRecord[block.id].children[index];
            const row = this.blocksRecord[rowId];
            if (row.type === 'table_row') {
              const content: TableRowNode['content'] = [];
              tableNode.content.push({
                type: 'table_row',
                content
              });
              for (const cell of row.table_row.cells) {
                const { contents, inlineLinkedPages } = convertRichText(cell);
                content.push({
                  type: index === 0 ? 'table_header' : 'table_cell',
                  content: contents
                });
                // await createInlinePageLinks(inlineLinkedPages);
              }
            }
          }
          return tableNode;
        }

        case 'column_list': {
          const columnLayoutNode: ColumnLayoutNode = {
            type: 'columnLayout',
            content: []
          };

          const childIds = block.children;
          for (let index = 0; index < childIds.length; index++) {
            const blockNode = (await this.populatePage(this.blocksRecord[childIds[index]])) as any;
            if (blockNode) {
              columnLayoutNode.content.push(blockNode);
            }
          }

          return columnLayoutNode;
        }

        case 'column': {
          const columnBlockNode: ColumnBlockNode = {
            type: 'columnBlock',
            // This empty paragraph is necessary, otherwise charmeditor throws an error
            content: [
              {
                type: 'paragraph',
                content: []
              }
            ]
          };

          const childIds = block.children;
          for (let index = 0; index < childIds.length; index++) {
            const blockNode = (await this.populatePage(this.blocksRecord[childIds[index]])) as any;
            if (blockNode) {
              columnBlockNode.content.push(blockNode);
            }
          }
          return columnBlockNode;
        }

        case 'link_to_page': {
          try {
            const linkedPageId =
              block.link_to_page.type === 'page_id' ? block.link_to_page.page_id : block.link_to_page.database_id;
            if (linkedPageId === this.notionPageId) {
              return {
                type: 'page',
                attrs: {
                  id: this.charmversePageId
                }
              };
            }

            const charmversePage = await this.fetcher.fetchAndCreatePage({
              charmverseParentPageId: this.charmversePageId,
              spaceId: this.spaceId,
              userId: this.userId,
              notionPageId: linkedPageId
            });
            return {
              type: 'page',
              attrs: {
                id: charmversePage.id
              }
            };
          } catch (_) {
            return log.debug('Error on linking page');
          }
        }

        case 'child_page': {
          try {
            const charmversePage = await this.fetcher.fetchAndCreatePage({
              charmverseParentPageId: this.charmversePageId,
              spaceId: this.spaceId,
              userId: this.userId,
              notionPageId: block.id
            });

            return {
              type: 'page',
              attrs: {
                id: charmversePage.id
              }
            };
          } catch (_) {
            return log.debug('Error on creating child page');
          }
        }
        default: {
          break;
        }
      }
    } catch (err) {
      //
    }
  }
}
