import type { Client } from '@notionhq/client';
import type { ListBlockChildrenParameters } from '@notionhq/client/build/src/api-endpoints';
import type { PageType } from '@prisma/client';
import { v4 } from 'uuid';

import {
  MAX_EMBED_WIDTH,
  MIN_EMBED_HEIGHT,
  MIN_EMBED_WIDTH
} from 'components/common/CharmEditor/components/iframe/config';
import { VIDEO_ASPECT_RATIO } from 'components/common/CharmEditor/components/video/videoSpec';
import type { IPropertyTemplate } from 'lib/focalboard/board';
import { createBoard } from 'lib/focalboard/board';
import { createBoardView } from 'lib/focalboard/boardView';
import { createCard } from 'lib/focalboard/card';
import log from 'lib/log';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/prosemirror/plugins/image/constants';
import { isTruthy } from 'lib/utilities/types';
import type {
  PageContent,
  BlockNode,
  CalloutNode,
  ColumnBlockNode,
  ColumnLayoutNode,
  DisclosureDetailsNode,
  ListItemNode,
  MentionNode,
  TableNode,
  TableRowNode
} from 'models';

import { convertPropertyType } from '../convertPropertyType';
import { convertRichText } from '../convertRichText';
import { convertToPlainText } from '../convertToPlainText';
import { getPersistentImageUrl } from '../getPersistentImageUrl';
import type {
  CreatePageInput,
  GetDatabaseResponse,
  BlockWithChildren,
  ChildBlockListResponse,
  RichTextItemResponse
} from '../types';

import type { NotionCache } from './NotionCache';
import type { NotionPageFetcher } from './NotionPageFetcher';

const BlocksWithChildrenRegex =
  /(heading_1|heading_2|heading_3|table|toggle|bulleted_list_item|callout|numbered_list_item|to_do|quote|column_list|column)/;

export class InMemoryRepresentation {
  cache: NotionCache;

  fetcher: NotionPageFetcher;

  client: Client;

  maxChildBlockDepth: number;

  constructor({
    cache,
    client,
    fetcher,
    maxChildBlockDepth = 10
  }: {
    maxChildBlockDepth?: number;
    cache: NotionCache;
    client: Client;
    fetcher: NotionPageFetcher;
  }) {
    this.cache = cache;
    this.client = client;
    this.fetcher = fetcher;
    this.maxChildBlockDepth = maxChildBlockDepth;
  }

  async represent({ spaceId, userId }: { spaceId: string; userId: string }) {
    const { notionPages, failedImportsRecord, populateFailedImportRecord } = this.cache;
    for (let index = 0; index < notionPages.length; index++) {
      const failedImportBlocks: [string, number][][] = [];
      const notionPage = notionPages[index];
      try {
        if (notionPage.object === 'page') {
          await this.createCharmversePageInMemory([[notionPage.id, v4()]], failedImportBlocks, { spaceId, userId });
        } else if (notionPage.object === 'database') {
          await this.createCharmverseDatabasePageInMemory(notionPage.id);
        }
        if (failedImportBlocks.length !== 0) {
          throw new Error();
        }
      } catch (err: any) {
        failedImportsRecord[notionPage.id] = populateFailedImportRecord(failedImportBlocks, notionPage);
        log.debug(`[notion] Failed to create page in memory ${notionPage.id}`);
      }
      if (index % 10 === 0) {
        log.debug(`[notion] Fetched ${index + 1} of ${notionPages.length} pages`);
      }
    }
  }

  async createCharmverseDatabasePageInMemory(notionDatabasePageId: string): Promise<CreatePageInput> {
    const { charmversePagesRecord, notionPagesRecord, focalboardRecord, spaceId, userId } = this.cache;
    const { retrieveDatabasePage } = this.fetcher;

    await retrieveDatabasePage(notionDatabasePageId);
    // Only create the database if it hasn't been created already
    if (!charmversePagesRecord[notionDatabasePageId]) {
      const notionPage = notionPagesRecord[notionDatabasePageId] as GetDatabaseResponse;
      const title = convertToPlainText(notionPage.title);
      const cardProperties: IPropertyTemplate[] = [];

      const board = createBoard();

      const focalboardPropertiesRecord: Record<string, string> = {};

      const databaseProperties = Object.values(notionPage.properties);
      databaseProperties.forEach((property) => {
        const focalboardPropertyType = convertPropertyType(property.type);
        if (focalboardPropertyType) {
          const cardProperty: IPropertyTemplate = {
            id: v4(),
            name: property.name,
            options: [],
            type: focalboardPropertyType
          };

          focalboardPropertiesRecord[property.id] = cardProperty.id;
          cardProperties.push(cardProperty);
          if (property.type === 'select' || property.type === 'multi_select') {
            (property as any)[property.type].options.forEach((option: { id: string; name: string; color: string }) => {
              cardProperty.options.push({
                value: option.name,
                color: `propColor${option.color.charAt(0).toUpperCase() + option.color.slice(1)}`,
                id: option.id
              });
            });
          }
        }
      });
      const headerImageUrl = notionPage.cover
        ? await getPersistentImageUrl({ image: notionPage.cover, spaceId })
        : null;

      board.title = title;
      board.fields.icon = notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : '';
      board.fields.headerImage = headerImageUrl;
      board.rootId = board.id;
      board.fields.cardProperties = cardProperties;
      const view = createBoardView();
      view.fields.viewType = 'board';
      view.parentId = board.id;
      view.rootId = board.rootId;
      view.title = 'Board view';

      const commonBlockData = {
        spaceId,
        createdBy: userId,
        updatedBy: userId,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      focalboardRecord[board.id] = {
        board: {
          ...board,
          ...commonBlockData
        },
        view: {
          ...view,
          ...commonBlockData
        },
        properties: focalboardPropertiesRecord
      };

      charmversePagesRecord[notionDatabasePageId] = {
        headerImage: headerImageUrl,
        icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : null,
        title,
        type: 'board',
        spaceId,
        createdBy: userId,
        boardId: board.id,
        id: board.id
      };
    }
    return charmversePagesRecord[notionDatabasePageId];
  }

  async createCharmversePageInMemory(
    pageIds: [string, string][],
    failedImportBlocks: [string, number][][],
    { spaceId, userId }: { spaceId: string; userId: string }
  ) {
    const {
      charmversePagesRecord,
      linkedPages,
      notionPagesRecord,
      blocksRecord,
      failedImportsRecord,
      focalboardRecord,
      charmverseCardsRecord,
      pagesWithoutIntegrationAccess,
      populateFailedImportRecord
    } = this.cache;
    const { blocksPerRequest, getChildren } = this.fetcher;
    const { createCharmverseDatabasePageInMemory, createCharmversePageInMemory } = this;

    // The last item of the pageIds is the notion block id and the optimistic charmverse page id
    const [notionPageId, charmversePageId] = pageIds[pageIds.length - 1];
    // The page might have been recursively created via a link_to_page block
    if (charmversePagesRecord[notionPageId]) return charmversePagesRecord[notionPageId];

    // An array to keep track of the first level children of a page
    const blocks: BlockWithChildren[] = [];
    // Page content, this will be filled with charmverse specific blocks
    const pageContent: PageContent = {
      type: 'doc',
      content: []
    };

    // Array to store parameters for further requests to retrieve children blocks
    let listBlockChildrenParameters: ListBlockChildrenParameters[] = [
      {
        block_id: notionPageId,
        page_size: blocksPerRequest
      }
    ];

    async function getListBlockChildrenResponses(): Promise<ChildBlockListResponse[]> {
      const childBlockListResponses = await Promise.all(
        listBlockChildrenParameters.map((listBlockChildrenParameter) => getChildren(listBlockChildrenParameter))
      ).then((_results) => _results.filter(isTruthy));

      // Reset the requests as they've all been fetched
      listBlockChildrenParameters = [];

      childBlockListResponses.forEach((childBlockListResponse) => {
        // If next_cursor exist then this block contains more child blocks
        if (childBlockListResponse.next_cursor) {
          listBlockChildrenParameters.push({
            // Using the request.block_id to get the block's parent id
            block_id: childBlockListResponse.request.block_id,
            page_size: blocksPerRequest,
            start_cursor: childBlockListResponse.next_cursor
          });
        }
      });

      return childBlockListResponses;
    }

    // notion.pages.retrieve will return an error if the integration doesn't have access to the page
    try {
      await this.fetcher.retrievePage(notionPageId);
      const notionPage = notionPagesRecord[notionPageId];

      // We allow a maximum of `MAX_CHILD_BLOCK_DEPTH` level of nested contents
      // Blocks like callout, quote, all forms of list allow other blocks to be nested inside them
      for (let depth = 0; depth < this.maxChildBlockDepth; depth++) {
        // While there are more children to be fetched
        if (listBlockChildrenParameters.length !== 0) {
          log.debug(`[notion] - ${listBlockChildrenParameters.length} Requests for child blocks at depth: ${depth}`);

          const childBlockListResponses = await getListBlockChildrenResponses();

          // If the block has more child to be fetch, this will be true
          while (listBlockChildrenParameters.length !== 0) {
            childBlockListResponses.push(...(await getListBlockChildrenResponses()));
          }

          // Reset the requests as they've all been fetched
          listBlockChildrenParameters = [];

          // Now that all child content has been fetched, we need to check if any of the child block has children or not
          // Go through each of the block and add them to the record
          // eslint-disable-next-line
          childBlockListResponses.forEach((childBlockListResponse) => {
            childBlockListResponse.results.forEach((block) => {
              const blockWithChildren: BlockWithChildren = {
                ...block,
                children: [],
                pageId: notionPageId
              };
              blocksRecord[block.id] = blockWithChildren;
              if (depth !== 0) {
                // Add the current block's id to its parent's `children` array
                blocksRecord[childBlockListResponse.request.block_id].children.push(block.id);
              } else {
                // Only push the top level blocks to the array
                blocks.push(blockWithChildren);
              }

              // If the block has children then we need to fetch them as well
              if (block.type.match(BlocksWithChildrenRegex) && block.has_children) {
                listBlockChildrenParameters.push({
                  block_id: block.id,
                  page_size: blocksPerRequest
                });
              }
            });
          });
        } else {
          break;
        }
      }

      for (let index = 0; index < blocks.length; index++) {
        try {
          await this.populateDoc(
            {
              parentNode: pageContent,
              block: blocks[index],
              blocksRecord,
              spaceId,
              userId,
              pageIds,
              onLinkToPage: async (linkedPageId, parentNode, inlineLink) => {
                const _failedImportBlocks: [string, number][][] = [];
                // If the pages hasn't been created already, only then create it
                // Find the parent its linking
                const parentAsLinkedPage = pageIds.find(([notionBlockId]) => notionBlockId === linkedPageId);
                // Make sure its not referencing itself otherwise an infinite loop will occur
                // Also make sure the linked page id is not its parent
                if (
                  linkedPageId &&
                  !linkedPages[linkedPageId] &&
                  linkedPageId !== notionPageId &&
                  !parentAsLinkedPage
                ) {
                  try {
                    const createdPage = await createCharmversePageInMemory(
                      [...pageIds, [linkedPageId, v4()]],
                      _failedImportBlocks,
                      {
                        spaceId,
                        userId
                      }
                    );
                    linkedPages[linkedPageId] = createdPage.id;
                    if (_failedImportBlocks.length !== 0) {
                      throw new Error();
                    }
                  } catch (_) {
                    log.debug('Error on creating child page');
                    failedImportsRecord[notionPagesRecord[linkedPageId].id] = populateFailedImportRecord(
                      _failedImportBlocks,
                      notionPagesRecord[linkedPageId]
                    );
                  }
                }

                if (!inlineLink) {
                  let id = linkedPages[linkedPageId];

                  // If its linking itself
                  if (linkedPageId === notionPageId) {
                    id = charmversePageId;
                  } else if (parentAsLinkedPage) {
                    id = parentAsLinkedPage[1];
                  }

                  (parentNode as PageContent).content?.push({
                    type: 'page',
                    attrs: {
                      id
                    }
                  });
                }

                if (linkedPages[linkedPageId]) {
                  return linkedPages[linkedPageId];
                }
                return null;
              }
            },
            [[blocks[index].type, index]]
          );
        } catch (err: any) {
          try {
            const failedBlocks = JSON.parse(err.message);
            failedImportBlocks.push(failedBlocks);
          } catch (_err) {
            //
          }
        }
      }
      // If there was no content in the notion page only then add an empty paragraph
      if (pageContent.content?.length === 0) {
        pageContent.content?.push({
          type: 'paragraph',
          content: []
        });
      }

      const headerImageUrl = notionPage.cover
        ? await getPersistentImageUrl({ image: notionPage.cover, spaceId })
        : null;
      if (notionPage.parent.type === 'page_id' || notionPage.parent.type === 'workspace') {
        const title = convertToPlainText((notionPage.properties.title as any)[notionPage.properties.title.type]);
        charmversePagesRecord[notionPageId] = {
          type: 'page',
          content: pageContent,
          headerImage: headerImageUrl,
          icon: notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : null,
          title,
          id: charmversePageId,
          spaceId,
          createdBy: userId
        };
      }
      // Focalboard cards
      else if (notionPage.parent.type === 'database_id') {
        // The database must be created before the cards can be added
        await createCharmverseDatabasePageInMemory(notionPage.parent.database_id);
        const charmverseDatabasePage = charmversePagesRecord[notionPage.parent.database_id];

        if (charmverseDatabasePage.boardId) {
          const titleProperty = Object.values(notionPage.properties).find((value) => value.type === 'title') as {
            title: { plain_text: string }[];
          };
          const emoji = notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : null;

          const title = convertToPlainText(titleProperty.title);
          const { properties } = focalboardRecord[charmverseDatabasePage.boardId];

          const cardProperties: Record<string, any> = {};

          Object.values(notionPage.properties).forEach((property) => {
            if (property[property.type]) {
              if (property.type.match(/(email|number|url|checkbox|phone_number)/)) {
                cardProperties[properties[property.id]] = property[property.type];
              } else if (property.type === 'rich_text') {
                cardProperties[properties[property.id]] = convertToPlainText(property[property.type]);
              } else if (property.type === 'select') {
                cardProperties[properties[property.id]] = property[property.type].id;
              } else if (property.type === 'multi_select') {
                cardProperties[properties[property.id]] = property[property.type].map(
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
                cardProperties[properties[property.id]] = JSON.stringify(dateValue);
              }
            }
          });

          const commonBlockData = {
            deletedAt: null,
            spaceId,
            createdBy: userId,
            updatedBy: userId,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          const headerImage = notionPage.cover
            ? await getPersistentImageUrl({ image: notionPage.cover, spaceId })
            : null;

          const cardPage = {
            createdBy: userId,
            id: charmversePageId,
            spaceId,
            cardId: charmversePageId,
            title,
            headerImage,
            icon: emoji,
            parentId: charmverseDatabasePage.id,
            content: pageContent,
            type: 'card' as PageType
          };
          charmverseCardsRecord[notionPageId] = {
            notionPageId,
            page: cardPage,
            card: {
              ...createCard({
                title,
                id: charmversePageId,
                parentId: charmverseDatabasePage.boardId,
                rootId: charmverseDatabasePage.boardId,
                fields: {
                  icon: emoji,
                  contentOrder: [],
                  headerImage,
                  properties: cardProperties
                }
              }),
              ...commonBlockData
            }
          };
          charmversePagesRecord[notionPageId] = cardPage;
        }
      }
      // Regular pages including databases
    } catch (error) {
      log.warn('Could not access page', { pageId: notionPageId, error });
      // TODO: Maybe show the user which pages they need to give access to the integration. but we can only show the id
      pagesWithoutIntegrationAccess.add(notionPageId);
    }
    return charmversePagesRecord[notionPageId];
  }

  async populateDoc(
    {
      parentNode: _parentNode,
      block: _block,
      blocksRecord,
      spaceId,
      userId,
      onLinkToPage,
      pageIds
    }: {
      userId: string;
      parentNode: BlockNode;
      block: BlockWithChildren;
      blocksRecord: Record<string, BlockWithChildren>;
      spaceId: string;
      onLinkToPage: (pageLink: string, parentNode: BlockNode, inlineLink: boolean) => Promise<string | null>;
      pageIds: [string, string][];
    },
    _parentInfo: [string, number][]
  ) {
    const { createCharmverseDatabasePageInMemory, cache, createCharmversePageInMemory } = this;
    const {
      pagesWithoutIntegrationAccess,
      charmversePagesRecord,
      notionPagesRecord,
      failedImportsRecord,
      populateFailedImportRecord
    } = cache;

    async function recurse(parentNode: BlockNode, block: BlockWithChildren, parentInfo: [string, number][]) {
      async function createInlinePageLinks(inlineLinkedPages: MentionNode[]) {
        for (const inlineLinkedPage of inlineLinkedPages) {
          try {
            const createdPageId = await onLinkToPage(inlineLinkedPage.attrs.value, parentNode, true);
            if (createdPageId) {
              inlineLinkedPage.attrs.value = createdPageId;
            }
          } catch (_) {
            //
          }
        }
      }

      try {
        switch (block.type) {
          case 'heading_1':
          case 'heading_2':
          case 'heading_3': {
            const level = Number(block.type.split('_')[1]);
            const { contents, inlineLinkedPages } = convertRichText((block as any)[block.type].rich_text);
            const children = blocksRecord[block.id].children;
            if (children.length !== 0) {
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

              for (let index = 0; index < children.length; index++) {
                const childId = children[index];
                await recurse(disclosureDetailsNode, blocksRecord[childId], [
                  ...parentInfo,
                  [blocksRecord[childId].type, index]
                ]);
              }
              (parentNode as PageContent).content?.push(disclosureDetailsNode);
            } else {
              // Regular heading 1
              (parentNode as PageContent).content?.push({
                type: 'heading',
                attrs: {
                  level
                },
                content: contents
              });
            }
            await createInlinePageLinks(inlineLinkedPages);
            break;
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

            await createInlinePageLinks(inlineLinkedPages);

            for (let index = 0; index < blocksRecord[block.id].children.length; index++) {
              const childId = blocksRecord[block.id].children[index];
              await recurse(disclosureDetailsNode, blocksRecord[childId], [
                ...parentInfo,
                [blocksRecord[childId].type, index]
              ]);
            }

            (parentNode as PageContent).content?.push(disclosureDetailsNode);

            break;
          }
          case 'column_list': {
            const columnLayoutNode: ColumnLayoutNode = {
              type: 'columnLayout',
              content: []
            };

            for (let index = 0; index < block.children.length; index++) {
              const childId = block.children[index];
              await recurse(columnLayoutNode, blocksRecord[childId], [
                ...parentInfo,
                [blocksRecord[childId].type, index]
              ]);
            }

            (parentNode as PageContent).content?.push(columnLayoutNode);
            break;
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
            for (let index = 0; index < block.children.length; index++) {
              const childId = block.children[index];
              await recurse(columnBlockNode, blocksRecord[childId], [
                ...parentInfo,
                [blocksRecord[childId].type, index]
              ]);
            }
            (parentNode as PageContent).content?.push(columnBlockNode);
            break;
          }

          case 'paragraph': {
            const { contents, inlineLinkedPages } = convertRichText(block[block.type].rich_text);
            (parentNode as PageContent).content?.push({
              type: 'paragraph',
              content: contents
            });

            await createInlinePageLinks(inlineLinkedPages);
            break;
          }

          case 'link_to_page': {
            await onLinkToPage((block[block.type] as any)[block[block.type].type] as string, parentNode, false);
            break;
          }

          case 'child_database': {
            // If its a database, we need to fetch more information from api
            try {
              await createCharmverseDatabasePageInMemory(block.id);
              (parentNode as PageContent).content?.push({
                type: 'page',
                attrs: {
                  id: charmversePagesRecord[block.id].id
                }
              });
            } catch (error) {
              log.warn('Could not retrieve database', { databaseId: block.id, error });
              pagesWithoutIntegrationAccess.add(block.id);
            }
            break;
          }

          case 'child_page': {
            const _failedImportBlocks: [string, number][][] = [];
            try {
              await createCharmversePageInMemory([...pageIds, [block.id, v4()]], _failedImportBlocks, {
                spaceId,
                userId
              });
              (parentNode as PageContent).content?.push({
                type: 'page',
                attrs: {
                  id: charmversePagesRecord[block.id].id
                }
              });
              if (_failedImportBlocks.length !== 0) {
                throw new Error();
              }
            } catch (_) {
              log.debug('Error on creating child page');
              failedImportsRecord[notionPagesRecord[block.id].id] = populateFailedImportRecord(
                _failedImportBlocks,
                notionPagesRecord[block.id]
              );
            }
            break;
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

            (parentNode as PageContent).content?.push({
              type: block.type === 'numbered_list_item' ? 'orderedList' : 'bulletList',
              content: [listItemNode]
            });

            await createInlinePageLinks(inlineLinkedPages);

            for (let index = 0; index < blocksRecord[block.id].children.length; index++) {
              const childId = blocksRecord[block.id].children[index];
              await recurse(listItemNode, blocksRecord[childId], [...parentInfo, [blocksRecord[childId].type, index]]);
            }
            break;
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
            const calloutNode: CalloutNode = {
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
            (parentNode as PageContent).content?.push(calloutNode);
            await createInlinePageLinks(inlineLinkedPages);
            for (let index = 0; index < blocksRecord[block.id].children.length; index++) {
              const childId = blocksRecord[block.id].children[index];
              await recurse(calloutNode, blocksRecord[childId], [...parentInfo, [blocksRecord[childId].type, index]]);
            }
            break;
          }

          case 'video': {
            (parentNode as PageContent).content?.push({
              type: 'iframe',
              attrs: {
                src: block.video.type === 'external' ? block.video.external.url : null,
                type: 'video',
                width: (MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2,
                height: (MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2 / VIDEO_ASPECT_RATIO
              }
            });
            break;
          }

          case 'embed':
          case 'bookmark': {
            (parentNode as PageContent).content?.push({
              type: 'iframe',
              attrs: {
                src: block.type === 'bookmark' ? block.bookmark.url : block.embed.url,
                type: 'embed',
                width: MAX_EMBED_WIDTH,
                height: MIN_EMBED_HEIGHT
              }
            });
            break;
          }

          case 'divider': {
            (parentNode as PageContent).content?.push({
              type: 'horizontalRule'
            });
            break;
          }

          case 'code': {
            (parentNode as PageContent).content?.push({
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
            });
            break;
          }

          case 'image': {
            const persistentUrl = await getPersistentImageUrl({ image: block.image, spaceId });
            (parentNode as PageContent).content?.push({
              type: 'image',
              attrs: {
                src: persistentUrl,
                size: (MAX_IMAGE_WIDTH + MIN_IMAGE_WIDTH) / 2,
                aspectRatio: 1
              }
            });
            break;
          }

          case 'table': {
            const tableNode: TableNode = {
              type: 'table',
              content: []
            };
            for (let index = 0; index < blocksRecord[block.id].children.length; index++) {
              const rowId = blocksRecord[block.id].children[index];
              const row = blocksRecord[rowId];
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
                  await createInlinePageLinks(inlineLinkedPages);
                }
              }
            }
            (parentNode as PageContent).content?.push(tableNode);
            break;
          }
          default: {
            break;
          }
        }
      } catch (err: any) {
        const errorTrails = [];
        try {
          const errorMessageData = JSON.parse(err.message);
          errorTrails.push(...errorMessageData);
        } catch (_) {
          log.debug('Error when creating blocks for page');
          //
        }
        throw new Error(JSON.stringify([parentInfo[parentInfo.length - 1], ...errorTrails]));
      }
    }

    await recurse(_parentNode, _block, _parentInfo);
  }
}
