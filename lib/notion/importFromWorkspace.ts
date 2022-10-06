import { Client } from '@notionhq/client';
import type { ListBlockChildrenParameters } from '@notionhq/client/build/src/api-endpoints';
import type { PageType, Prisma } from '@prisma/client';
import promiseRetry from 'promise-retry';
import { v4 as uuid } from 'uuid';

import { prisma } from 'db';
import { getFilePath, uploadUrlToS3 } from 'lib/aws/uploadToS3Server';
import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT, MIN_EMBED_WIDTH, VIDEO_ASPECT_RATIO } from 'lib/embed/constants';
import { extractEmbedLink } from 'lib/embed/extractEmbedLink';
import type { IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { createBoard } from 'lib/focalboard/board';
import { createBoardView } from 'lib/focalboard/boardView';
import { createCard } from 'lib/focalboard/card';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/image/constants';
import log from 'lib/log';
import { checkIsContentEmpty } from 'lib/pages/checkIsContentEmpty';
import { createPage } from 'lib/pages/server/createPage';
import { getPagePath } from 'lib/pages/utils';
import { setupPermissionsAfterPageCreated } from 'lib/permissions/pages';
import { isTruthy } from 'lib/utilities/types';
import type { BlockNode, CalloutNode, ColumnBlockNode, ColumnLayoutNode, DisclosureDetailsNode, ListItemNode, MentionNode, Page, PageContent, TableNode, TableRowNode, TextContent } from 'models';

import type { BlockObjectResponse, GetDatabaseResponse, GetPageResponse, NotionImage, RichTextItemResponse } from './types';

// Limit the highest number of pages that can be imported
const IMPORTED_PAGES_LIMIT = 10000;
const BLOCKS_FETCHED_PER_REQUEST = 100;
const MAX_CHILD_BLOCK_DEPTH = 10;

function convertRichText (richTexts: RichTextItemResponse[]): {
  contents: (TextContent | MentionNode)[];
  inlineLinkedPages: MentionNode[];
} {
  const contents: (TextContent | MentionNode)[] = [];
  const inlineLinkedPages: MentionNode[] = [];

  richTexts.forEach((richText) => {
    const marks: { type: string, attrs?: Record<string, string> }[] = [];
    if (richText.type !== 'mention') {
      if (richText.annotations.strikethrough) {
        marks.push({ type: 'strike' });
      }

      if (richText.annotations.bold) {
        marks.push({ type: 'bold' });
      }

      if (richText.annotations.italic) {
        marks.push({ type: 'italic' });
      }

      if (richText.annotations.underline) {
        marks.push({ type: 'underline' });
      }

      if (richText.annotations.code) {
        marks.push({ type: 'code' });
      }

      if (richText.href) {
        marks.push({
          type: 'link',
          attrs: {
            href: richText.href
          }
        });
      }

      if (richText.plain_text) {
        contents.push({
          type: 'text',
          text: richText.plain_text,
          marks
        });
      }
    }
    else if (richText.mention?.type === 'page') {
      const inlineLinkedPage: MentionNode = {
        type: 'mention',
        attrs: {
          type: 'page',
          value: richText.mention.page.id
        }
      };
      contents.push(inlineLinkedPage);
      inlineLinkedPages.push(inlineLinkedPage);
    }
    else if (richText.mention?.type === 'database') {
      const inlineLinkedPage: MentionNode = {
        type: 'mention',
        attrs: {
          type: 'page',
          value: richText.mention.database.id
        }
      };
      contents.push(inlineLinkedPage);
      inlineLinkedPages.push(inlineLinkedPage);
    }
  });

  return {
    contents,
    inlineLinkedPages
  };
}

interface ChildBlockListResponse {
  request: ListBlockChildrenParameters;
  results: BlockObjectResponse[];
  next_cursor: string | null;
}

type BlockWithChildren = BlockObjectResponse & { children: string[], pageId: string };

// eslint-disable-next-line
const BlocksWithChildrenRegex = /(heading_1|heading_2|heading_3|table|toggle|bulleted_list_item|callout|numbered_list_item|to_do|quote|column_list|column)/;

async function populateDoc (
  {
    parentNode: _parentNode,
    block: _block,
    blocksRecord,
    spaceId,
    onLinkToPage,
    onChildDatabase,
    onChildPage
  }: {
    parentNode: BlockNode;
    block: BlockWithChildren;
    blocksRecord: Record<string, BlockWithChildren>;
    spaceId: string;
    onLinkToPage: (pageLink: string, parentNode: BlockNode, inlineLink: boolean) => Promise<string | null>;
    onChildDatabase: (block: BlockWithChildren, parentNode: BlockNode) => Promise<void>;
    onChildPage: (block: BlockWithChildren, parentNode: BlockNode) => Promise<void>;
  },
  _parentInfo: [string, number][]
) {
  async function recurse (parentNode: BlockNode, block: BlockWithChildren, parentInfo: [string, number][]) {
    async function createInlinePageLinks (inlineLinkedPages: MentionNode[]) {
      for (const inlineLinkedPage of inlineLinkedPages) {
        try {
          const createdPageId = await onLinkToPage(inlineLinkedPage.attrs.value, parentNode, true);
          if (createdPageId) {
            inlineLinkedPage.attrs.value = createdPageId;
          }
        }
        catch (_) {
          //
        }
      }
    }

    try {
      switch (block.type) {
        case 'heading_1':
        case 'heading_2':
        case 'heading_3':
        {
          const level = Number(block.type.split('_')[1]);
          const { contents, inlineLinkedPages } = convertRichText((block as any)[block.type].rich_text);
          const children = blocksRecord[block.id].children;
          if (children.length !== 0) {
            // Toggle list heading 1
            const disclosureDetailsNode: DisclosureDetailsNode = {
              type: 'disclosureDetails',
              content: [{
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
              }]
            };

            for (let index = 0; index < children.length; index++) {
              const childId = children[index];
              await recurse(disclosureDetailsNode, blocksRecord[childId], [...parentInfo, [blocksRecord[childId].type, index]]);
            }
            (parentNode as PageContent).content?.push(disclosureDetailsNode);
          }
          else {
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
            content: [{
              type: 'disclosureSummary',
              content: [
                {
                  type: 'paragraph',
                  content: contents
                }
              ]
            }]
          };

          await createInlinePageLinks(inlineLinkedPages);

          for (let index = 0; index < blocksRecord[block.id].children.length; index++) {
            const childId = blocksRecord[block.id].children[index];
            await recurse(disclosureDetailsNode, blocksRecord[childId], [...parentInfo, [blocksRecord[childId].type, index]]);
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
            await recurse(columnLayoutNode, blocksRecord[childId], [...parentInfo, [blocksRecord[childId].type, index]]);
          }

          (parentNode as PageContent).content?.push(columnLayoutNode);
          break;
        }

        case 'column': {
          const columnBlockNode: ColumnBlockNode = {
            type: 'columnBlock',
            // This empty paragraph is necessary, otherwise charmeditor throws an error
            content: [{
              type: 'paragraph',
              content: []
            }]
          };
          for (let index = 0; index < block.children.length; index++) {
            const childId = block.children[index];
            await recurse(columnBlockNode, blocksRecord[childId], [...parentInfo, [blocksRecord[childId].type, index]]);
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
          await onChildDatabase(block, parentNode);
          break;
        }

        case 'child_page': {
          await onChildPage(block, parentNode);
          break;
        }

        case 'bulleted_list_item':
        case 'numbered_list_item':
        case 'to_do':
        {
          let richText: RichTextItemResponse[] = [];

          if (block.type === 'bulleted_list_item') {
            richText = block.bulleted_list_item.rich_text;
          }
          else if (block.type === 'numbered_list_item') {
            richText = block.numbered_list_item.rich_text;
          }
          else if (block.type === 'to_do') {
            richText = block.to_do.rich_text;
          }

          const { contents, inlineLinkedPages } = convertRichText(richText);

          const listItemNode: ListItemNode = {
            type: 'listItem',
            content: [{
              type: 'paragraph',
              content: contents
            }],
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
          }
          else if (block.type === 'quote') {
            richText = block.quote.rich_text;
          }
          const { contents, inlineLinkedPages } = convertRichText(richText);
          const calloutNode: CalloutNode = {
            type: block.type === 'callout' ? 'blockquote' : 'quote' as any,
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
              src: block.video.type === 'external' ? extractEmbedLink(block.video.external.url) : null,
              type: 'video',
              width: (MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2,
              height: ((MIN_EMBED_WIDTH + MAX_EMBED_WIDTH) / 2) / VIDEO_ASPECT_RATIO
            }
          });
          break;
        }

        case 'embed':
        case 'bookmark':
        {
          (parentNode as PageContent).content?.push({
            type: 'iframe',
            attrs: {
              src: extractEmbedLink(block.type === 'bookmark' ? block.bookmark.url : block.embed.url),
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
            content: [{
              type: 'text',
              text: block.code.rich_text[0].plain_text
            }],
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
    }
    catch (err: any) {
      const errorTrails = [];
      try {
        const errorMessageData = JSON.parse(err.message);
        errorTrails.push(...errorMessageData);
      }
      catch (_) {
        log.debug('Error when creating blocks for page');
        //
      }
      throw new Error(JSON.stringify([parentInfo[parentInfo.length - 1], ...errorTrails]));
    }
  }

  await recurse(_parentNode, _block, _parentInfo);
}

function convertPropertyType (propertyType: string): PropertyType | null {
  switch (propertyType) {
    case 'email':
    case 'number':
    case 'url':
    case 'select':
    case 'checkbox':
    case 'date':
      return propertyType;
    case 'multi_select':
      return 'multiSelect';
    case 'rich_text':
      return 'text';
    case 'created_time':
      return 'createdTime';
    case 'updated_time':
      return 'updatedTime';
    case 'phone_number':
      return 'phone';
    default: {
      return null;
    }
  }
}

type CreatePageInput = {
  id: string;
  content?: Prisma.NullableJsonNullValueInput | Prisma.InputJsonValue;
  headerImage?: string | null;
  icon?: string | null;
  spaceId: string;
  title: string;
  type?: Page['type'];
  createdBy: string;
  boardId?: string;
  parentId?: string | null;
  cardId?: string;
}
// &  {userId: string, spaceId: string, pageId: string, title: string};

async function createPrismaPage ({
  id,
  content = {
    type: 'doc',
    content: [{
      type: 'paragraph',
      content: []
    }]
  },
  headerImage = null,
  icon,
  spaceId,
  title,
  type = 'page',
  createdBy,
  boardId,
  parentId,
  cardId
}: CreatePageInput) {

  const pageToCreate: Prisma.PageCreateInput = {
    id,
    content,
    // TODO: Generate content text
    contentText: '',
    createdAt: new Date(),
    author: {
      connect: {
        id: createdBy
      }
    },
    updatedAt: new Date(),
    updatedBy: createdBy,
    path: getPagePath(),
    space: {
      connect: {
        id: spaceId || undefined
      }
    },
    autoGenerated: true,
    headerImage,
    icon,
    title: title || '',
    type,
    boardId,
    parentId
  };

  if (type === 'card' && cardId) {
    pageToCreate.card = {
      connect: {
        id: cardId
      }
    };
  }

  // eslint-disable-next-line
  let page = await createPage({ data: pageToCreate });

  page = await setupPermissionsAfterPageCreated(page.id);

  return page;
}

function convertToPlainText (chunks: { plain_text: string }[]) {
  return chunks.reduce((prev: string, cur: { plain_text: string }) => prev + cur.plain_text, '');
}

export async function importFromWorkspace ({ workspaceName, workspaceIcon, accessToken, userId, spaceId }:
  { accessToken: string; spaceId: string; userId: string;
    workspaceName: string;
    workspaceIcon: string;
  }) {
  const charmversePagesRecord: Record<string, CreatePageInput> = {};
  const charmverseCardsRecord: Record<string, {
    card: Prisma.BlockCreateManyInput;
    page: CreatePageInput;
    notionPageId: string;
  }> = {};

  const blocksRecord: Record<string, BlockWithChildren> = {};

  const linkedPages: Record<string, string> = {};
  const focalboardRecord: Record<string, {
    board: Prisma.BlockCreateManyInput;
    view: Prisma.BlockCreateManyInput;
    properties: Record<string, string>;
  }> = {};
  const pagesWithoutIntegrationAccess: Set<string> = new Set();
  const failedImportsRecord: Record<string, {
    pageId: string;
    type: 'page' | 'database';
    title: string;
    blocks: [string, number][][];
  }> = {};
  const notionPagesRecord: Record<string, GetPageResponse | GetDatabaseResponse> = {};

  const notion = new Client({
    auth: accessToken
  });

  let searchResult = await notion.search({
    page_size: BLOCKS_FETCHED_PER_REQUEST
  });

  // Store all the blocks the integration has access to
  const notionPages = searchResult.results as (GetPageResponse | GetDatabaseResponse)[];
  // Store all the pages/databases the integration fetched in a record
  // While there are more pages the integration has access to
  while (searchResult.has_more && searchResult.next_cursor && notionPages.length < IMPORTED_PAGES_LIMIT) {
    searchResult = await notion.search({
      page_size: BLOCKS_FETCHED_PER_REQUEST,
      start_cursor: searchResult.next_cursor
    });
    notionPages.push(...searchResult.results as (GetPageResponse | GetDatabaseResponse)[]);
  }

  notionPages.forEach(notionPage => {
    // This would ideally decrease the amount of api requests made to fetch a page/database
    notionPagesRecord[notionPage.id] = notionPage;
  });

  function populateFailedImportRecord (
    failedImportBlocks: [string, number][][],
    block: GetPageResponse | GetDatabaseResponse
  ) {
    let title = '';
    // Database
    if (block.object === 'database') {
      title = convertToPlainText((block.title));
    }
    else if (block.parent.type === 'database_id') {
      // Focalboard cards
      title = convertToPlainText((Object.values(block.properties).find(property => property.type === 'title') as any).title);
    }
    // Regular page
    else {
      title = convertToPlainText((block.properties.title as any)[block.properties.title.type]);
    }
    failedImportsRecord[block.id] = {
      pageId: block.id,
      /* eslint react/forbid-prop-types: 0 */
      type: block.object,
      title,
      blocks: failedImportBlocks
    };
  }

  async function retrieveNotionPage (notionPageId: string) {
    // If the page doesn't exist in the cache fetch it
    if (!notionPagesRecord[notionPageId]) {
      const pageResponse = await notion.pages.retrieve({
        page_id: notionPageId
      }) as unknown as GetPageResponse;
      notionPagesRecord[notionPageId] = pageResponse;
      notionPages.push(pageResponse);
      log.debug(`[notion]: Retrieved page ${notionPageId} manually`);
    }
  }

  async function retrieveNotionDatabasePage (notionDatabasePageId: string) {
    if (!notionPagesRecord[notionDatabasePageId]) {
      const databasePage = await notion.databases.retrieve({
        database_id: notionDatabasePageId
      }) as GetDatabaseResponse;
      notionPagesRecord[notionDatabasePageId] = databasePage;
      notionPages.push(databasePage);
      log.debug(`[notion]: Retrieved database ${notionDatabasePageId} manually`);
    }
  }

  log.debug(`[notion] Fetching content for ${notionPages.length} pages`, { spaceId });

  for (let index = 0; index < notionPages.length; index++) {
    const failedImportBlocks: [string, number][][] = [];
    const notionPage = notionPages[index];
    try {
      if (notionPage.object === 'page') {
        await createCharmversePageInMemory([[notionPage.id, uuid()]], failedImportBlocks);
      }
      else if (notionPage.object === 'database') {
        await createCharmverseDatabasePageInMemory(notionPage.id);
      }
      if (failedImportBlocks.length !== 0) {
        throw new Error();
      }
    }
    catch (err: any) {
      populateFailedImportRecord(failedImportBlocks, notionPage);
      log.debug(`[notion] Failed to create page in memory ${notionPage.id}`);
    }
    if (index % 10 === 0) {
      log.debug(`[notion] Fetched ${index + 1} of ${notionPages.length} pages`);
    }
  }

  async function createCharmverseDatabasePageInMemory (notionDatabasePageId: string): Promise<CreatePageInput> {
    await retrieveNotionDatabasePage(notionDatabasePageId);
    // Only create the database if it hasn't been created already
    if (!charmversePagesRecord[notionDatabasePageId]) {
      const notionPage = notionPagesRecord[notionDatabasePageId] as GetDatabaseResponse;
      const title = convertToPlainText(notionPage.title);
      const cardProperties: IPropertyTemplate[] = [];

      const board = createBoard();

      const focalboardPropertiesRecord : Record<string, string> = {};

      const databaseProperties = Object.values(notionPage.properties);
      databaseProperties.forEach(property => {
        const focalboardPropertyType = convertPropertyType(property.type);
        if (focalboardPropertyType) {
          const cardProperty: IPropertyTemplate = {
            id: uuid(),
            name: property.name,
            options: [],
            type: focalboardPropertyType
          };

          focalboardPropertiesRecord[property.id] = cardProperty.id;
          cardProperties.push(cardProperty);
          if (property.type === 'select' || property.type === 'multi_select') {
            (property as any)[property.type].options.forEach((option: { id: string, name: string, color: string }) => {
              cardProperty.options.push({
                value: option.name,
                color: `propColor${option.color.charAt(0).toUpperCase() + option.color.slice(1)}`,
                id: option.id
              });
            });
          }
        }
      });
      const headerImageUrl = notionPage.cover ? await getPersistentImageUrl({ image: notionPage.cover, spaceId }) : null;

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

  // Array of tuple, [notion block id, charmverse block id]
  async function createCharmversePageInMemory (pageIds: [string, string][], failedImportBlocks: [string, number][][]) {
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
    let listBlockChildrenParameters: ListBlockChildrenParameters[] = [{
      block_id: notionPageId,
      page_size: BLOCKS_FETCHED_PER_REQUEST
    }];

    function getChildren (listBlockChildrenParameter: ListBlockChildrenParameters) {
      return promiseRetry<ChildBlockListResponse | void>((retry) => {
        return notion.blocks.children.list(listBlockChildrenParameter).then(response => ({
          results: response.results,
          request: listBlockChildrenParameter,
          next_cursor: response.next_cursor
        } as ChildBlockListResponse))
          .catch(error => {
            if (error.status > 499) {
              retry(error);
            }
            else {
              throw error;
            }
          });
      }, {
        retries: 3
      });
    }

    async function getListBlockChildrenResponses (): Promise<ChildBlockListResponse[]> {
      const childBlockListResponses = await Promise.all(listBlockChildrenParameters
        .map(listBlockChildrenParameter => getChildren(listBlockChildrenParameter)))
        .then(_results => _results.filter(isTruthy));

      // Reset the requests as they've all been fetched
      listBlockChildrenParameters = [];

      childBlockListResponses.forEach(childBlockListResponse => {
        // If next_cursor exist then this block contains more child blocks
        if (childBlockListResponse.next_cursor) {
          listBlockChildrenParameters.push({
          // Using the request.block_id to get the block's parent id
            block_id: childBlockListResponse.request.block_id,
            page_size: BLOCKS_FETCHED_PER_REQUEST,
            start_cursor: childBlockListResponse.next_cursor
          });
        }
      });

      return childBlockListResponses;
    }

    // notion.pages.retrieve will return an error if the integration doesn't have access to the page
    try {
      await retrieveNotionPage(notionPageId);
      const notionPage = notionPagesRecord[notionPageId];

      // We allow a maximum of `MAX_CHILD_BLOCK_DEPTH` level of nested contents
      // Blocks like callout, quote, all forms of list allow other blocks to be nested inside them
      for (let depth = 0; depth < MAX_CHILD_BLOCK_DEPTH; depth++) {
      // While there are more children to be fetched
        if (listBlockChildrenParameters.length !== 0) {

          log.debug(`[notion] - ${listBlockChildrenParameters.length} Requests for child blocks at depth: ${depth}`);

          const childBlockListResponses = await getListBlockChildrenResponses();

          // If the block has more child to be fetch, this will be true
          while (listBlockChildrenParameters.length !== 0) {
            childBlockListResponses.push(...await getListBlockChildrenResponses());
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
              }
              else {
              // Only push the top level blocks to the array
                blocks.push(blockWithChildren);
              }

              // If the block has children then we need to fetch them as well
              if (block.type.match(BlocksWithChildrenRegex) && block.has_children) {
                listBlockChildrenParameters.push({
                  block_id: block.id,
                  page_size: BLOCKS_FETCHED_PER_REQUEST
                });
              }
            });
          });
        }
        else {
          break;
        }
      }

      for (let index = 0; index < blocks.length; index++) {
        try {
          await populateDoc({
            parentNode: pageContent,
            block: blocks[index],
            blocksRecord,
            spaceId,
            onChildDatabase: async (block, parentNode) => {
              // If its a database, we need to fetch more information from api
              try {
                await createCharmverseDatabasePageInMemory(block.id);
                (parentNode as PageContent).content?.push({
                  type: 'page',
                  attrs: {
                    id: charmversePagesRecord[block.id].id
                  }
                });
              }
              catch (error) {
                log.warn('Could not retrieve database', { databaseId: block.id, error });
                pagesWithoutIntegrationAccess.add(block.id);
              }
            },
            onChildPage: async (block, parentNode) => {
              const _failedImportBlocks: [string, number][][] = [];
              try {
                await createCharmversePageInMemory([...pageIds, [block.id, uuid()]], _failedImportBlocks);
                (parentNode as PageContent).content?.push({
                  type: 'page',
                  attrs: {
                    id: charmversePagesRecord[block.id].id
                  }
                });
                if (_failedImportBlocks.length !== 0) {
                  throw new Error();
                }
              }
              catch (_) {
                log.debug('Error on creating child page');
                populateFailedImportRecord(_failedImportBlocks, notionPagesRecord[block.id]);
              }
            },
            onLinkToPage: async (linkedPageId, parentNode, inlineLink) => {
              const _failedImportBlocks: [string, number][][] = [];
              // If the pages hasn't been created already, only then create it
              // Find the parent its linking
              const parentAsLinkedPage = pageIds.find(([notionBlockId]) => notionBlockId === linkedPageId);
              // Make sure its not referencing itself otherwise an infinite loop will occur
              // Also make sure the linked page id is not its parent
              if (linkedPageId && !linkedPages[linkedPageId] && linkedPageId !== notionPageId && !parentAsLinkedPage) {
                try {
                  const createdPage = await createCharmversePageInMemory([...pageIds, [linkedPageId, uuid()]], _failedImportBlocks);
                  linkedPages[linkedPageId] = createdPage.id;
                  if (_failedImportBlocks.length !== 0) {
                    throw new Error();
                  }
                }
                catch (_) {
                  log.debug('Error on creating child page');
                  populateFailedImportRecord(_failedImportBlocks, notionPagesRecord[linkedPageId]);
                }
              }

              if (!inlineLink) {
                let id = linkedPages[linkedPageId];

                // If its linking itself
                if (linkedPageId === notionPageId) {
                  id = charmversePageId;
                }
                else if (parentAsLinkedPage) {
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
          }, [[blocks[index].type, index]]);
        }
        catch (err: any) {
          try {
            const failedBlocks = JSON.parse(err.message);
            failedImportBlocks.push(failedBlocks);
          }
          catch (_err) {
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

      const headerImageUrl = notionPage.cover ? await getPersistentImageUrl({ image: notionPage.cover, spaceId }) : null;
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
        // eslint-disable-next-line
          await createCharmverseDatabasePageInMemory(notionPage.parent.database_id);
        const charmverseDatabasePage = charmversePagesRecord[notionPage.parent.database_id];

        if (charmverseDatabasePage.boardId) {
          const titleProperty = Object.values(notionPage.properties).find(value => value.type === 'title') as { title: { plain_text: string }[] };
          const emoji = notionPage.icon?.type === 'emoji' ? notionPage.icon.emoji : null;

          const title = convertToPlainText(titleProperty.title);
          const { properties } = focalboardRecord[charmverseDatabasePage.boardId];

          const cardProperties: Record<string, any> = {};

          Object.values(notionPage.properties).forEach(property => {
            if (property[property.type]) {
              if (property.type.match(/(email|number|url|checkbox|phone_number)/)) {
                cardProperties[properties[property.id]] = property[property.type];
              }
              else if (property.type === 'rich_text') {
                cardProperties[properties[property.id]] = convertToPlainText(property[property.type]);
              }
              else if (property.type === 'select') {
                cardProperties[properties[property.id]] = property[property.type].id;
              }
              else if (property.type === 'multi_select') {
                cardProperties[properties[property.id]] = property[property.type]
                  .map((multiSelect: { id: string }) => multiSelect.id);
              }
              else if (property.type === 'date') {
                const dateValue: { from?: number, to?: number } = {};
                if (property[property.type].start) {
                  dateValue.from = (new Date(property[property.type].start)).getTime();
                }

                if (property[property.type].end) {
                  dateValue.to = (new Date(property[property.type].end)).getTime();
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
          const headerImage = notionPage.cover ? await getPersistentImageUrl({ image: notionPage.cover, spaceId }) : null;

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
    }
    catch (error) {
      log.warn('Could not access page', { pageId: notionPageId, error });
      // TODO: Maybe show the user which pages they need to give access to the integration. but we can only show the id
      pagesWithoutIntegrationAccess.add(notionPageId);
    }
    return charmversePagesRecord[notionPageId];
  }

  const workspacePage = await createPrismaPage({
    id: uuid(),
    icon: workspaceIcon,
    spaceId,
    title: workspaceName,
    createdBy: userId
  });

  const ungroupedPageInput = {
    id: uuid(),
    icon: null,
    spaceId,
    title: 'Ungrouped',
    createdBy: userId,
    parentId: workspacePage.id
  };

  let totalUngroupedPages = 0;
  const createdCharmversePageIds: Set<string> = new Set();

  async function createCharmverseDatabasePage (notionPageId: string, parentId?: string | null) {
    try {
      await createPrismaPage({
        ...charmversePagesRecord[notionPageId],
        parentId
      });

      const charmverseDatabasePage = charmversePagesRecord[notionPageId];
      if (charmverseDatabasePage && charmverseDatabasePage.boardId) {
        const { board, view } = focalboardRecord[charmverseDatabasePage.boardId];
        await prisma.block.createMany({
          data: [
            view,
            board
          ]
        });
      }
      createdCharmversePageIds.add(notionPageId);
    }
    catch (_) {
      log.debug(`Error creating charmverse database page ${notionPageId}`);
      if (!failedImportsRecord[notionPageId]) {
        populateFailedImportRecord([], notionPagesRecord[notionPageId]);
      }
    }
  }

  async function createCharmversePage (notionPageId: string, parentId?: string | null) {
    try {
      await createPrismaPage({
        ...charmversePagesRecord[notionPageId],
        parentId
      });
      createdCharmversePageIds.add(notionPageId);
    }
    catch (_) {
      log.debug(`Error creating charmverse page ${notionPageId}`);
      if (!failedImportsRecord[notionPageId]) {
        populateFailedImportRecord([], notionPagesRecord[notionPageId]);
      }
    }
  }

  async function createCharmversePageFromNotionPage (block: GetPageResponse | GetDatabaseResponse) {
    const failedToImportBlock = failedImportsRecord[block.id] && failedImportsRecord[block.id].blocks.length === 0;
    if (!failedToImportBlock) {
      // pages and databases
      if (block.parent.type === 'page_id') {
        // Create its parent first, parent could be regular page or database pages
        if (!createdCharmversePageIds.has(block.parent.page_id) && notionPagesRecord[block.parent.page_id]) {
          await createCharmversePageFromNotionPage(notionPagesRecord[block.parent.page_id]);
        }
        let parentId = null;
        const failedToImportParent = failedImportsRecord[block.parent.page_id] && failedImportsRecord[block.parent.page_id].blocks.length === 0;
        if (failedToImportParent) {
          totalUngroupedPages += 1;
          parentId = ungroupedPageInput.id;
        }
        // If the parent was created successfully
        // Or if we failed to import some blocks from the parent (partial success)
        else if (notionPagesRecord[block.parent.page_id] && createdCharmversePageIds.has(block.parent.page_id)) {
          // Check if the parent is a regular page first
          // If its not then the parent is a database page (focalboard card)
          parentId = charmversePagesRecord[block.parent.page_id]?.id ?? charmverseCardsRecord[block.parent.page_id]?.page?.id;
        }
        else {
          // Parent id could be a block, for example there could be a nested page inside a callout/quote/column block
          // Here parent.page_id is not actually the the id of the page, its the id of the nearest parent of the page, which could be callout/quote/column block
          parentId = charmversePagesRecord[blocksRecord[block.parent.page_id]?.pageId]?.id ?? ungroupedPageInput.id;
        }

        if (block.object === 'database') {
          await createCharmverseDatabasePage(block.id, parentId);
        }
        else if (block.object === 'page') {
          await createCharmversePage(block.id, parentId);
        }
      }
      // Focalboard cards
      // If the card has been created (in memory) and the database has been created in memory
      else if (block.parent.type === 'database_id' && charmverseCardsRecord[block.id] && charmversePagesRecord[block.parent.database_id]) {
        // If the parent wasn't created create it first if there were no errors
        if (!createdCharmversePageIds.has(block.parent.database_id)
            && notionPagesRecord[block.parent.database_id]) {
          await createCharmversePageFromNotionPage(notionPagesRecord[block.parent.database_id]);
        }
        // Make sure the database page has not failed to be created, otherwise no cards will be added
        const { notionPageId, page, card } = charmverseCardsRecord[block.id];
        if (!failedImportsRecord[block.parent.database_id] && createdCharmversePageIds.has(block.parent.database_id)) {
          await prisma.block.create({
            data: card
          });
          // Creating the page corresponding to the card
          await createCharmversePage(notionPageId, page.parentId);
        }
        // If the database wasn't imported then the cards cant be created, so add them to failedImportRecord
        else {
          failedImportsRecord[notionPageId] = {
            blocks: [],
            pageId: notionPageId,
            title: card.title,
            type: 'page'
          };
        }
      }
      // Top level pages and databases
      else if (block.parent.type === 'workspace') {
        if (block.object === 'database') {
          await createCharmverseDatabasePage(block.id, workspacePage.id);
        }
        else if (block.object === 'page') {
          await createCharmversePage(block.id, workspacePage.id);
        }
      }
    }
  }

  for (let index = 0; index < notionPages.length; index++) {
    const notionPage = notionPages[index];
    // check if we already created the page and skip
    if ((notionPage?.object === 'database' || notionPage?.object === 'page') && !createdCharmversePageIds.has(notionPage.id)) {
      await createCharmversePageFromNotionPage(notionPage);
    }
  }

  if (totalUngroupedPages > 0) {
    await createPrismaPage(ungroupedPageInput);
  }

  log.info('[notion] Completed import of Notion pages', {
    'Notion pages': notionPages.length,
    'CharmVerse pages': Object.keys(charmversePagesRecord).length,
    'CharmVerse cards': Object.keys(charmverseCardsRecord).length,
    'Created CharmVerse pages (incl. cards)': createdCharmversePageIds.size,
    'Failed import pages': failedImportsRecord,
    pagesWithoutIntegrationAccess
  });

  return Object.values(failedImportsRecord).slice(0, 25);
}

// if image is stored in notion s3, it will expire so we need to re-upload it to our s3
function getPersistentImageUrl ({ image, spaceId }: { image: NotionImage, spaceId: string }): Promise<string | null> {
  const url = image.type === 'external' ? image.external.url : image.type === 'file' ? image.file.url : null;
  const isNotionS3 = url?.includes('amazonaws.com/secure.notion-static.com');
  if (url && isNotionS3) {
    const pathInS3 = getFilePath({ url, spaceId });
    return uploadUrlToS3({ pathInS3, url }).then(r => r.url).catch(error => {
      log.warn('could not upload image to s3', { error });
      return url;
    });
  }
  else {
    return Promise.resolve(url);
  }
}
