import { Client } from '@notionhq/client';
import { BlockNode, CalloutNode, ColumnBlockNode, ColumnLayoutNode, ListItemNode, MentionNode, Page, PageContent, TableNode, TableRowNode, TextContent } from 'models';
import { ListBlockChildrenParameters } from '@notionhq/client/build/src/api-endpoints';
import { Prisma } from '@prisma/client';
import { prisma } from 'db';
import { v4 as uuid } from 'uuid';
import log from 'lib/log';
import { extractEmbedLink } from 'lib/embed/extractEmbedLink';
import { MIN_EMBED_WIDTH, MAX_EMBED_WIDTH, VIDEO_ASPECT_RATIO, MIN_EMBED_HEIGHT } from 'lib/embed/constants';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/image/constants';
import { createBoard, IPropertyTemplate, PropertyType } from 'lib/focalboard/board';
import { createBoardView } from 'lib/focalboard/boardView';
import { createCharmTextBlock } from 'lib/focalboard/charmBlock';
import { createCard } from 'lib/focalboard/card';
import { BlockObjectResponse, GetDatabaseResponse, GetPageResponse, RichTextItemResponse } from './types';

// Limit the highest number of pages that can be imported
const IMPORTED_PAGES_LIMIT = 1000;
const BLOCKS_FETCHED_PER_REQUEST = 100;
const MAX_CHILD_BLOCK_DEPTH = 10;

function convertRichText (richTexts: RichTextItemResponse[]): {
  contents: (TextContent | MentionNode)[],
  inlineLinkedPages: MentionNode[]
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
  request: ListBlockChildrenParameters,
  results: BlockObjectResponse[],
  next_cursor: string | null
}

type BlockWithChildren = BlockObjectResponse & { children: string[], pageId: string };

const BlocksWithChildrenRegex = /(table|bulleted_list_item|callout|numbered_list_item|to_do|quote|column_list|column)/;

async function populateDoc (
  _parentNode: BlockNode,
  _block: BlockWithChildren,
  blocksRecord: Record<string, BlockWithChildren>,
  {
    onLinkToPage,
    onChildDatabase,
    onChildPage
  }: {
    onLinkToPage: (pageLink: string, parentNode: BlockNode, inlineLink: boolean) => Promise<string | null>,
    onChildDatabase: (block: BlockWithChildren, parentNode: BlockNode) => Promise<void>,
    onChildPage: (block: BlockWithChildren, parentNode: BlockNode) => Promise<void>
  },
  _parentInfo: [string, number][]
) {

  async function recurse (parentNode: BlockNode, block: BlockWithChildren, parentInfo: [string, number][]) {
    try {
      switch (block.type) {
        case 'heading_1': {
          (parentNode as PageContent).content?.push({
            type: 'heading',
            attrs: {
              level: 1
            },
            content: convertRichText(block.heading_1.rich_text).contents
          });
          break;
        }

        case 'heading_2': {
          (parentNode as PageContent).content?.push({
            type: 'heading',
            attrs: {
              level: 2
            },
            content: convertRichText(block.heading_2.rich_text).contents
          });
          break;
        }

        case 'heading_3': {
          (parentNode as PageContent).content?.push({
            type: 'heading',
            attrs: {
              level: 2
            },
            content: convertRichText(block.heading_3.rich_text).contents
          });
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
          for (const inlineLinkedPage of inlineLinkedPages) {
            try {
              const createdPageId = await onLinkToPage(inlineLinkedPage.attrs.value, parentNode, true);
              // Replace the notion page id with the charmverse one
              if (createdPageId) {
                inlineLinkedPage.attrs.value = createdPageId;
              }
            }
            catch (_) {
              //
            }
          }
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

          for (const inlineLinkedPage of inlineLinkedPages) {
            try {
              const createdPageId = await onLinkToPage(inlineLinkedPage.attrs.value, parentNode, true);
              // Replace the notion page id with the charmverse one
              if (createdPageId) {
                inlineLinkedPage.attrs.value = createdPageId;
              }
            }
            catch (_) {
              //
            }
          }

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
          for (const inlineLinkedPage of inlineLinkedPages) {
            try {
              const createdPageId = await onLinkToPage(inlineLinkedPage.attrs.value, parentNode, true);
              // Replace the notion page id with the charmverse one
              if (createdPageId) {
                inlineLinkedPage.attrs.value = createdPageId;
              }
            }
            catch (_) {
              //
            }
          }
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
          (parentNode as PageContent).content?.push({
            type: 'image',
            attrs: {
              src: block.image.type === 'external' ? block.image.external.url : block.image.type === 'file' ? block.image.file.url : null,
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
                for (const inlineLinkedPage of inlineLinkedPages) {
                  try {
                    const createdPageId = await onLinkToPage(inlineLinkedPage.attrs.value, parentNode, true);
                    // Replace the notion page id with the charmverse one
                    if (createdPageId) {
                      inlineLinkedPage.attrs.value = createdPageId;
                    }
                  }
                  catch (_) {
                    //
                  }
                }
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
  cardId?: string
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
    path: `page-${id}`,
    space: {
      connect: {
        id: spaceId || undefined
      }
    },
    cardId,
    autoGenerated: true,
    headerImage,
    icon,
    title: title || '',
    type,
    boardId,
    parentId,
    permissions: {
      create: [
        {
          permissionLevel: 'full_access',
          spaceId
        }
      ]
    }
  };

  // eslint-disable-next-line
  const page = await prisma.page.create({ data: pageToCreate });
  return page;
}

function convertToPlainText (chunks: {plain_text: string}[]) {
  return chunks.reduce((prev: string, cur: { plain_text: string }) => prev + cur.plain_text, '');
}

interface CreateDatabaseResult {
  focalboardPropertiesRecord: Record<string, string>;
  board: Prisma.BlockCreateManyInput;
  view: Prisma.BlockCreateManyInput;
  page: CreatePageInput;
}

async function createDatabase (block: GetDatabaseResponse, {
  spaceId,
  userId
}: {spaceId: string, userId: string}): Promise<CreateDatabaseResult> {
  const title = convertToPlainText((block as any).title);
  const cardProperties: IPropertyTemplate[] = [];

  const board = createBoard();

  const focalboardPropertiesRecord : Record<string, string> = {};

  const databaseProperties = Object.values(block.properties);
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
        (property as any)[property.type].options.forEach((option: {id: string, name: string, color: string}) => {
          cardProperty.options.push({
            value: option.name,
            color: `propColor${option.color.charAt(0).toUpperCase() + option.color.slice(1)}`,
            id: option.id
          });
        });
      }
    }
  });

  board.title = title;
  board.fields.icon = block.icon?.type === 'emoji' ? block.icon.emoji : '';
  board.fields.headerImage = block.cover?.type === 'external' ? block.cover.external.url : block.cover?.type === 'file' ? block.cover.file.url : null;
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

  return {
    board: {
      ...board,
      ...commonBlockData
    },
    view: {
      ...view,
      ...commonBlockData
    },
    focalboardPropertiesRecord,
    page: {
      headerImage: block.cover?.type === 'external' ? block.cover.external.url : block.cover?.type === 'file' ? block.cover?.file.url : null,
      icon: block.icon?.type === 'emoji' ? block.icon.emoji : null,
      title,
      type: 'board',
      spaceId,
      createdBy: userId,
      boardId: board.id,
      id: uuid()
    }
  };
}

export async function importFromWorkspace ({ workspaceName, workspaceIcon, accessToken, userId, spaceId }:
  { accessToken: string, spaceId: string, userId: string,
    workspaceName: string,
    workspaceIcon: string
  }) {
  const pagesWithoutIntegrationAccess: Set<string> = new Set();
  const failedImportsRecord: Record<string, {
    pageId: string,
    type: 'page' | 'database',
    title: string,
    blocks: [string, number][][]
  }> = {};

  const notion = new Client({
    auth: accessToken
  });

  let searchResult = await notion.search({
    page_size: BLOCKS_FETCHED_PER_REQUEST
  });

  // Store all the blocks the integration has access to
  const searchResults = searchResult.results as (GetPageResponse | GetDatabaseResponse)[];

  // While there are more pages the integration has access to
  while (searchResult.has_more && searchResult.next_cursor && searchResults.length < IMPORTED_PAGES_LIMIT) {
    searchResult = await notion.search({
      page_size: BLOCKS_FETCHED_PER_REQUEST,
      start_cursor: searchResult.next_cursor
    });
    searchResults.push(...searchResult.results as (GetPageResponse | GetDatabaseResponse)[]);
  }

  // Store all the pages/databases the integration fetched in a record
  const searchResultRecord: Record<string, GetPageResponse | GetDatabaseResponse> = {};

  const createdPages: Record<string, CreatePageInput> = {};

  const createdCards: Record<string, {
    charmText: Prisma.BlockCreateManyInput,
    card: Prisma.BlockCreateManyInput
    page: CreatePageInput,
    notionPageId: string
  }> = {};

  const blocksRecord: Record<string, BlockWithChildren> = {};

  const linkedPages: Record<string, string> = {};
  const focalboardRecord: Record<string, {
    board: Prisma.BlockCreateManyInput,
    view: Prisma.BlockCreateManyInput,
    properties: Record<string, string>
  }> = {};

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
      type: block.object,
      title,
      blocks: failedImportBlocks
    };
  }

  // This loop would ideally decrease the amount of api requests made to fetch a page/database
  for (let index = 0; index < searchResults.length; index++) {
    const block = searchResults[index];
    searchResultRecord[block.id] = block;
  }

  log.debug(`[notion] Fetching content for ${searchResults.length} pages`, { spaceId });

  for (let index = 0; index < searchResults.length; index++) {
    const failedImportBlocks: [string, number][][] = [];
    const notionPage = searchResults[index];
    try {
      if (notionPage.object === 'page') {
        await createPage([[notionPage.id, uuid()]], failedImportBlocks);
      }
      else if (notionPage.object === 'database') {
        await createDatabaseAndPopulateCache(notionPage);
      }
      if (failedImportBlocks.length !== 0) {
        throw new Error();
      }
    }
    catch (err: any) {
      populateFailedImportRecord(failedImportBlocks, notionPage);
    }
    if (index % 10 === 0) {
      log.debug(`[notion] Fetched ${index + 1} of ${searchResults.length} pages`);
    }
  }

  async function createDatabaseAndPopulateCache (block: GetDatabaseResponse) {
    // Only create the database if it hasn't been created already
    if (!createdPages[block.id]) {
      const { board, focalboardPropertiesRecord, page, view } = await createDatabase(block as GetDatabaseResponse, {
        spaceId,
        userId
      });

      focalboardRecord[board.id] = {
        board,
        view,
        properties: focalboardPropertiesRecord
      };
      createdPages[block.id] = page as any;
    }

    return createdPages[block.id];
  }

  // Array of tuple, [notion block id, charmverse block id]
  async function createPage (pageIds: [string, string][], failedImportBlocks: Array<[string, number][]>) {
    // The last item of the pageIds is the notion block id and the optimistic charmverse page id
    const [notionPageId, charmversePageId] = pageIds[pageIds.length - 1];
    // The page might have been recursively created via a link_to_page block
    if (createdPages[notionPageId]) return createdPages[notionPageId];

    // An array to keep track of the first level children of a page
    const blocks: BlockWithChildren[] = [];
    // Page content, this will be filled with charmverse specific blocks
    const pageContent: PageContent = {
      type: 'doc',
      content: []
    };

    // Array to store parameters for further requests to retrieve children blocks
    let blockChildrenRequests: ListBlockChildrenParameters[] = [{
      block_id: notionPageId,
      page_size: BLOCKS_FETCHED_PER_REQUEST
    }];

    async function getChildBlockListResponses () {
      const childBlockListResponses = (await Promise.all<ChildBlockListResponse>(
        blockChildrenRequests.map(blockChildrenRequest => new Promise((resolve) => {
          notion.blocks.children.list(blockChildrenRequest).then((response => resolve({
            results: response.results as BlockObjectResponse[],
            // Request contains the block_id, which is used to detect the parent of this group of child blocks
            request: blockChildrenRequest,
            next_cursor: response.next_cursor
          })));
        }))
      ));

      // Reset the requests as they've all been fetched
      blockChildrenRequests = [];

      childBlockListResponses.forEach(childBlockListResponse => {
      // If next_cursor exist then this block contains more child blocks
        if (childBlockListResponse.next_cursor) {
          blockChildrenRequests.push({
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
      // If the page doesn't exist in the cache fetch it
      const pageResponse = searchResultRecord[notionPageId] ?? await notion.pages.retrieve({
        page_id: notionPageId
      }) as unknown as GetPageResponse;

      // We allow a maximum of `MAX_CHILD_BLOCK_DEPTH` level of nested contents
      // Blocks like callout, quote, all forms of list allow other blocks to be nested inside them
      for (let depth = 0; depth < MAX_CHILD_BLOCK_DEPTH; depth++) {
      // While there are more children to be fetched
        if (blockChildrenRequests.length !== 0) {

          // log.debug(`[notion] - ${blockChildrenRequests.length} Requests for child blocks at depth: ${depth}`);

          const childBlockListResponses = await getChildBlockListResponses();

          // If the block has more child to be fetch, this will be true
          while (blockChildrenRequests.length !== 0) {
            childBlockListResponses.push(...await getChildBlockListResponses());
          }

          // Reset the requests as they've all been fetched
          blockChildrenRequests = [];

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
                blockChildrenRequests.push({
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
          await populateDoc(pageContent, blocks[index], blocksRecord, {
            onChildDatabase: async (block, parentNode) => {
              // If its a database, we need to fetch more information from api
              try {
                const databaseResponse = await notion.databases.retrieve({
                  database_id: block.id
                }) as GetDatabaseResponse;
                searchResultRecord[block.id] = databaseResponse;
                createdPages[block.id] = await createDatabaseAndPopulateCache(databaseResponse);

                (parentNode as PageContent).content?.push({
                  type: 'page',
                  attrs: {
                    id: createdPages[block.id].id
                  }
                });
              }
              catch (_) {
                pagesWithoutIntegrationAccess.add(block.id);
              }
            },
            onChildPage: async (block, parentNode) => {
              const _failedImportBlocks: [string, number][][] = [];
              try {
                createdPages[block.id] = await createPage([...pageIds, [block.id, uuid()]], _failedImportBlocks);
                (parentNode as PageContent).content?.push({
                  type: 'page',
                  attrs: {
                    id: createdPages[block.id].id
                  }
                });
                if (_failedImportBlocks.length !== 0) {
                  throw new Error();
                }
              }
              catch (_) {
                log.debug('Error on creating child page');
                populateFailedImportRecord(_failedImportBlocks, searchResultRecord[block.id]);
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
                  const createdPage = await createPage([...pageIds, [linkedPageId, uuid()]], _failedImportBlocks);
                  linkedPages[linkedPageId] = createdPage.id;
                  if (_failedImportBlocks.length !== 0) {
                    throw new Error();
                  }
                }
                catch (_) {
                  log.debug('Error on creating child page');
                  populateFailedImportRecord(_failedImportBlocks, searchResultRecord[linkedPageId]);
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
      // Regular pages including databases
      if (pageResponse.parent.type === 'page_id' || pageResponse.parent.type === 'workspace') {
        const title = convertToPlainText((pageResponse.properties.title as any)[pageResponse.properties.title.type]);
        createdPages[notionPageId] = {
          type: 'page',
          content: pageContent,
          headerImage: pageResponse.cover?.type === 'external' ? pageResponse.cover.external.url : pageResponse.cover?.type === 'file' ? pageResponse.cover?.file.url : null,
          icon: pageResponse.icon?.type === 'emoji' ? pageResponse.icon.emoji : null,
          title,
          id: charmversePageId,
          spaceId,
          createdBy: userId
        };
        return createdPages[notionPageId];
      }
      // Focalboard cards
      else if (pageResponse.parent.type === 'database_id') {
      // The database must be created before the cards can be added
      // eslint-disable-next-line

        await createDatabaseAndPopulateCache(searchResultRecord[pageResponse.parent.database_id] as GetDatabaseResponse);
        const database = createdPages[pageResponse.parent.database_id];

        if (database.boardId) {
          const titleProperty = Object.values(pageResponse.properties).find(value => value.type === 'title') as {title: {plain_text: string}[]};
          const emoji = pageResponse.icon?.type === 'emoji' ? pageResponse.icon.emoji : null;

          const title = convertToPlainText(titleProperty.title);
          const charmTextBlock = createCharmTextBlock({
            parentId: charmversePageId,
            fields: {
              content: pageContent
            }
          });
          const { properties } = focalboardRecord[database.boardId];

          const cardProperties: Record<string, any> = {};

          Object.values(pageResponse.properties).forEach(property => {
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
                  .map((multiSelect: {id: string}) => multiSelect.id);
              }
              else if (property.type === 'date') {
                const dateValue: {from?: number, to?: number} = {};
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

          const headerImage = pageResponse.cover?.type === 'external' ? pageResponse.cover.external.url : pageResponse.cover?.type === 'file' ? pageResponse.cover.file.url : null;

          const cardPage = {
            createdBy: userId,
            id: charmversePageId,
            spaceId,
            cardId: charmversePageId,
            title,
            headerImage,
            icon: emoji,
            parentId: database.id,
            content: pageContent
          };
          createdCards[notionPageId] = {
            notionPageId,
            page: cardPage,
            charmText: {
              ...charmTextBlock,
              ...commonBlockData,
              rootId: database.boardId
            },
            card: {
              ...createCard({
                title,
                id: charmversePageId,
                parentId: database.boardId,
                rootId: database.boardId,
                fields: {
                  icon: emoji,
                  contentOrder: [charmTextBlock.id],
                  headerImage,
                  properties: cardProperties
                }
              }),
              ...commonBlockData
            }
          };
          createdPages[notionPageId] = cardPage;
        }
      }
    }
    catch (_: any) {
      // TODO: Maybe show the user which pages they need to give access to the integration. but we can only show the id
      pagesWithoutIntegrationAccess.add(notionPageId);
    }
    return createdPages[notionPageId];
  }

  const workspacePage = await createPrismaPage({
    id: uuid(),
    icon: workspaceIcon,
    spaceId,
    title: workspaceName,
    createdBy: userId
  });

  async function createCharmversePage (blockId: string, type: 'page' | 'database', parentId?: string | null) {
    try {
      await createPrismaPage({
        ...createdPages[blockId],
        parentId
      });

      if (type === 'database') {
        const databasePage = createdPages[blockId];
        if (databasePage && databasePage.boardId) {
          const { board, view } = focalboardRecord[databasePage.boardId];
          await prisma.block.createMany({
            data: [
              view,
              board
            ]
          });
        }
      }
    }
    catch (_) {
      log.debug('Error creating charmverse page');
      if (!failedImportsRecord[blockId]) {
        populateFailedImportRecord([], searchResultRecord[blockId]);
      }
    }
  }

  const charmversePageIds = searchResults.map(_searchResult => _searchResult.id);
  const createdPagesSet: Set<string> = new Set();

  async function createCharmversePageFromNotionPage (block: GetPageResponse | GetDatabaseResponse) {
    // pages and databases
    if (block.parent.type === 'page_id') {
      // Create its parent first, parent could be regular page or database pages
      if (!createdPagesSet.has(block.parent.page_id) && searchResultRecord[block.parent.page_id]) {
        await createCharmversePageFromNotionPage(searchResultRecord[block.parent.page_id]);
      }
      let parentId = workspacePage.id;
      // If the parent was created successfully
      // Or if we failed to import some blocks from the parent (partial success)
      if ((!failedImportsRecord[block.parent.page_id]
              || (failedImportsRecord[block.parent.page_id].blocks.length !== 0))
              && searchResultRecord[block.parent.page_id]) {
        // Check if the parent is a regular page first
        // If its not then the parent is a database page (focalboard card)
        parentId = createdPages[block.parent.page_id]?.id ?? createdCards[block.parent.page_id]?.page?.id;
      }
      else {
        // Parent id could be a block, for example there could be a nested page inside a callout/quote/column block
        // Here parent.page_id is not actually the the id of the page, its the id of the nearest parent of the page, which could be callout/quote/column block
        parentId = createdPages[blocksRecord[block.parent.page_id]?.pageId]?.id ?? workspacePage.id;
      }

      if (!createdPagesSet.has(block.id)) {
        await createCharmversePage(block.id, block.object, parentId);
      }
    }
    // Focalboard cards
    // If the card has been created (in memory) and the database has been created in memory
    else if (block.parent.type === 'database_id' && createdCards[block.id] && createdPages[block.parent.database_id]) {
      // If the parent wasn't created create it first
      if (!createdPagesSet.has(block.parent.database_id) && searchResultRecord[block.parent.database_id]) {
        await createCharmversePageFromNotionPage(searchResultRecord[block.parent.database_id]);
      }
      // Make sure the database page has not failed to be created, otherwise no cards will be added
      if (!failedImportsRecord[block.parent.database_id] && !createdPagesSet.has(block.id)) {
        const { notionPageId, page, card, charmText } = createdCards[block.id];
        await prisma.block.createMany({
          data: [
            card,
            charmText
          ]
        });
        // Creating the page corresponding to the card
        await createCharmversePage(notionPageId, 'page', page.parentId);
      }
    }
    // Top level pages and databases, make sure it hasn't been created already
    else if (block.parent.type === 'workspace' && !createdPagesSet.has(block.id)) {
      await createCharmversePage(block.id, block.object, workspacePage.id);
    }
    createdPagesSet.add(block.id);
  }

  for (let index = 0; index < charmversePageIds.length; index++) {
    const charmversePageId = charmversePageIds[index];
    const block = searchResultRecord[charmversePageId];
    if (block?.object === 'database' || block?.object === 'page') {
      await createCharmversePageFromNotionPage(block);
    }
  }

  log.info(`[notion] Completed import of ${searchResults.length} pages`, { pagesWithoutIntegrationAccess });

  return Object.values(failedImportsRecord);
}
