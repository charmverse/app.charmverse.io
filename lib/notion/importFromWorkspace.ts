import { Client } from '@notionhq/client';
import { BlockNode, CalloutNode, ListItemNode, Page, PageContent, TableNode, TableRowNode, TextContent } from 'models';
import { ListBlockChildrenParameters } from '@notionhq/client/build/src/api-endpoints';
import { Prisma } from '@prisma/client';
import { extractEmbedLink, MIN_EMBED_WIDTH, MAX_EMBED_WIDTH, VIDEO_ASPECT_RATIO, MIN_EMBED_HEIGHT } from 'components/editor/ResizableIframe';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'components/editor/ResizableImage';
import { prisma } from 'db';
import { v4 } from 'uuid';
import { Board, createBoard, IPropertyTemplate, PropertyType } from 'components/databases/focalboard/src/blocks/board';
import { createBoardView } from 'components/databases/focalboard/src/blocks/boardView';
import { createCard } from 'components/databases/focalboard/src/blocks/card';
import { createCharmTextBlock } from 'components/databases/focalboard/src/blocks/charmBlock';
import { BlockObjectResponse, GetDatabaseResponse, GetPageResponse, RichTextItemResponse } from './types';

// Limit the highest number of pages that can be imported
const IMPORTED_PAGES_LIMIT = 1000; const
  BLOCKS_FETCHED_PER_REQUEST = 100; const
  MAX_CHILD_BLOCK_DEPTH = 5;

function convertRichText (richTexts: RichTextItemResponse[]): TextContent[] {
  return richTexts.map((richText) => {
    const marks: { type: string, attrs?: Record<string, string> }[] = [];
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

    return {
      type: 'text',
      text: richText.plain_text,
      marks
    };
  });
}

interface ChildBlockListResponse {
  request: ListBlockChildrenParameters,
  results: BlockObjectResponse[],
  next_cursor: string | null
}

type BlockWithChildren = BlockObjectResponse & { children: string[] };

const BlocksWithChildrenRegex = /(table|bulleted_list_item|callout|numbered_list_item|to_do|quote)/;

async function populateDoc (
  parentNode: BlockNode,
  block: BlockWithChildren,
  blocksRecord: Record<string, BlockWithChildren>,
  {
    onLinkToPage,
    onChildDatabase,
    onChildPage
  }: {
    onLinkToPage: (pageLink: string, parentNode: BlockNode) => Promise<void>,
    onChildDatabase: (block: BlockWithChildren, parentNode: BlockNode) => Promise<void>,
    onChildPage: (block: BlockWithChildren, parentNode: BlockNode) => Promise<void>
  }
) {

  switch (block.type) {
    case 'heading_1': {
      (parentNode as PageContent).content?.push({
        type: 'heading',
        attrs: {
          level: 1
        },
        content: convertRichText(block.heading_1.rich_text)
      });
      break;
    }

    case 'heading_2': {
      (parentNode as PageContent).content?.push({
        type: 'heading',
        attrs: {
          level: 2
        },
        content: convertRichText(block.heading_2.rich_text)
      });
      break;
    }

    case 'heading_3': {
      (parentNode as PageContent).content?.push({
        type: 'heading',
        attrs: {
          level: 2
        },
        content: convertRichText(block.heading_3.rich_text)
      });
      break;
    }

    case 'paragraph': {
      (parentNode as PageContent).content?.push({
        type: 'paragraph',
        content: convertRichText(block[block.type].rich_text)
      });
      break;
    }

    case 'link_to_page': {
      await onLinkToPage((block[block.type] as any)[block[block.type].type] as string, parentNode);
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

      const listItemNode: ListItemNode = {
        type: 'listItem',
        content: [{
          type: 'paragraph',
          content: convertRichText(richText)
        }],
        attrs: {
          todoChecked: block.type === 'to_do' ? block.to_do.checked : null
        }
      };

      (parentNode as PageContent).content?.push({
        type: block.type === 'numbered_list_item' ? 'orderedList' : 'bulletList',
        content: [listItemNode]
      });

      for (let index = 0; index < blocksRecord[block.id].children.length; index++) {
        const childId = blocksRecord[block.id].children[index];
        await populateDoc(listItemNode, blocksRecord[childId], blocksRecord, {
          onLinkToPage,
          onChildDatabase,
          onChildPage
        });
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

      const calloutNode: CalloutNode = {
        type: block.type === 'callout' ? 'blockquote' : 'quote' as any,
        attrs: {
          emoji
        },
        content: [
          {
            type: 'paragraph',
            content: convertRichText(richText)
          }
        ]
      };
      (parentNode as PageContent).content?.push(calloutNode);
      for (let index = 0; index < blocksRecord[block.id].children.length; index++) {
        const childId = blocksRecord[block.id].children[index];
        await populateDoc(calloutNode, blocksRecord[childId], blocksRecord, {
          onLinkToPage,
          onChildDatabase,
          onChildPage
        });
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
          src: block.image.type === 'external' ? block.image.external.url : null,
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
      blocksRecord[block.id].children.forEach((rowId, rowIndex) => {
        const row = blocksRecord[rowId];
        if (row.type === 'table_row') {
          const content: TableRowNode['content'] = [];
          tableNode.content.push({
            type: 'table_row',
            content
          });
          row.table_row.cells.forEach((cell) => {
            content.push({
              type: rowIndex === 0 ? 'table_header' : 'table_cell',
              content: convertRichText(cell)
            });
          });
        }
      });
      (parentNode as PageContent).content?.push(tableNode);
      break;
    }
    default: {
      break;
    }
  }
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

async function createPrismaPage ({
  pageId = v4(),
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
  userId,
  boardId
}: {
  pageId?: string,
  content?: PageContent
  userId: string
  spaceId: string
  headerImage?: string | null
  icon: string | null
  title: string
  type?: Prisma.PageCreateInput['type'],
  boardId?: string | null
}) {
  const id = Math.random().toString().replace('0.', '');

  const pageToCreate: Prisma.PageCreateInput = {
    id: pageId,
    content,
    // TODO: Generate content text
    contentText: '',
    createdAt: new Date(),
    author: {
      connect: {
        id: userId
      }
    },
    updatedAt: new Date(),
    updatedBy: userId,
    path: `page-${id}`,
    space: {
      connect: {
        id: spaceId
      }
    },
    headerImage,
    icon,
    title,
    type,
    boardId
  };

  // eslint-disable-next-line
  const page = await prisma.page.create({ data: pageToCreate });
  return page;
}

function convertToPlainText (chunks: {plain_text: string}[]) {
  return chunks.reduce((prev: string, cur: { plain_text: string }) => prev + cur.plain_text, '');
}

async function createDatabase (block: GetDatabaseResponse, {
  spaceId,
  userId,
  focalboardRecord
}: {focalboardRecord: Record<string, Record<string, string>>, spaceId: string, userId: string}) {
  const title = convertToPlainText((block as any).title);
  const cardProperties: IPropertyTemplate[] = [];

  const board = createBoard(undefined, false);
  focalboardRecord[board.id] = {};

  const databaseProperties = Object.values(block.properties);
  databaseProperties.forEach(property => {
    const focalboardPropertyType = convertPropertyType(property.type);
    if (focalboardPropertyType) {
      const cardProperty: IPropertyTemplate = {
        id: v4(),
        name: property.name,
        options: [],
        type: focalboardPropertyType
      };

      focalboardRecord[board.id][property.id] = cardProperty.id;
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
  board.fields.headerImage = block.cover?.type === 'external' ? block.cover.external.url : null;
  board.rootId = board.id;
  board.fields.cardProperties = cardProperties;
  const view = createBoardView();
  view.fields.viewType = 'board';
  view.parentId = board.id;
  view.rootId = board.rootId;
  view.title = 'Board view';
  const newBlocks = [board, view].map(_block => ({
    ..._block,
    fields: _block.fields as any,
    spaceId,
    createdBy: userId,
    updatedBy: userId,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null
  }));
  await prisma.block.createMany({
    data: newBlocks
  });

  const createdPage = await createPrismaPage({
    headerImage: block.cover?.type === 'external' ? block.cover.external.url : null,
    icon: block.icon?.type === 'emoji' ? block.icon.emoji : null,
    title,
    type: 'board',
    spaceId,
    userId,
    boardId: board.id
  });

  return createdPage;
}

export async function importFromWorkspace ({ workspaceName, workspaceIcon, accessToken, userId, spaceId }:
  { accessToken: string, spaceId: string, userId: string,
    workspaceName: string,
    workspaceIcon: string
  }) {

  const notion = new Client({
    auth: accessToken
  });

  let searchResult = await notion.search({
    page_size: BLOCKS_FETCHED_PER_REQUEST
  });

  const searchResults = searchResult.results;

  // While there are more pages the integration has access to
  while (searchResult.has_more && searchResult.next_cursor && searchResults.length < IMPORTED_PAGES_LIMIT) {
    searchResult = await notion.search({
      page_size: BLOCKS_FETCHED_PER_REQUEST,
      start_cursor: searchResult.next_cursor
    });
    searchResults.push(...searchResult.results);
  }

  const searchResultRecord: Record<string, GetPageResponse | GetDatabaseResponse> = {};

  const createdPages: Record<string, Page> = {};
  const linkedPages: Record<string, string> = {};
  const focalboardRecord: Record<string, Record<string, string>> = {};

  // This loop would decrease the amount of api requests made
  for (let index = 0; index < searchResults.length; index++) {
    const block = searchResults[index] as GetPageResponse | GetDatabaseResponse;
    searchResultRecord[block.id] = block;
  }

  for (let index = 0; index < searchResults.length; index++) {
    const block = searchResults[index] as GetPageResponse | GetDatabaseResponse;
    if (block.object === 'page') {
      await createPage([[block.id, v4()]]);
    }
    else if (block.object === 'database') {
      // Only create the database if it hasn't been created already
      if (!createdPages[block.id]) {
        createdPages[block.id] = await createDatabase(block as GetDatabaseResponse, {
          spaceId,
          userId,
          focalboardRecord
        });
      }
    }
  }

  // Array of tuple, [notion block id, charmverse block id]
  async function createPage (pageIds: [string, string][]) {
    const [blockId, createdPageId] = pageIds[pageIds.length - 1];
    // The page might be recursively created via a link_to_page block
    if (createdPages[blockId]) return createdPages[blockId];

    // If the page doesn't exist in the cache fetch it
    const pageResponse = searchResultRecord[blockId] ?? await notion.pages.retrieve({
      page_id: blockId
    }) as unknown as GetPageResponse;

    // Store all the blocks of a page, including nested ones
    const blocksRecord: Record<string, BlockWithChildren> = {};
    // An array to keep track of the first level children of a page
    const blocks: BlockWithChildren[] = [];
    // Page content, this will be filled with charmverse specific blocks
    const pageContent: PageContent = {
      type: 'doc',
      content: []
    };

    // Array to store parameters for further requests to retrieve children blocks
    let blockChildrenRequests: ListBlockChildrenParameters[] = [{
      block_id: blockId,
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

      blockChildrenRequests = [];

      childBlockListResponses.forEach(childBlockListResponse => {
        // If next_cursor exist then this block contains more child blocks
        if (childBlockListResponse.next_cursor) {
          blockChildrenRequests.push({
            block_id: childBlockListResponse.request.block_id,
            page_size: BLOCKS_FETCHED_PER_REQUEST,
            start_cursor: childBlockListResponse.next_cursor ?? undefined
          });
        }
      });

      return childBlockListResponses;
    }

    for (let depth = 0; depth < MAX_CHILD_BLOCK_DEPTH; depth++) {
      if (blockChildrenRequests.length !== 0) {
        const childBlockListResponses = await getChildBlockListResponses();

        // If the block has more child to be fetch, fetch them using the cursor
        while (blockChildrenRequests.length !== 0) {
          childBlockListResponses.push(...await getChildBlockListResponses());
        }

        // Now that all child content has been fetched, we need to check if any of the child block has children or not
        blockChildrenRequests = [];

        // Go through each of the block and add them to the record
        // eslint-disable-next-line
        childBlockListResponses.forEach((childBlockListResponse) => {
          childBlockListResponse.results.forEach((block) => {
            const blockWithChildren = {
              ...block,
              children: []
            };
            blocksRecord[block.id] = blockWithChildren;
            if (depth !== 0) {
              // Add the current block to the its parent's `children` array
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
      await populateDoc(pageContent, blocks[index], blocksRecord, {
        onChildDatabase: async (block, parentNode) => {
          // If its a database, we need to fetch more information from api
          createdPages[block.id] = await createDatabase(await notion.databases.retrieve({
            database_id: block.id
          }) as any, {
            spaceId,
            userId,
            focalboardRecord
          });

          (parentNode as PageContent).content?.push({
            type: 'page',
            attrs: {
              id: createdPages[block.id].id
            }
          });
        },
        onChildPage: async (block, parentNode) => {
          createdPages[block.id] = await createPage([...pageIds, [block.id, v4()]]);
          (parentNode as PageContent).content?.push({
            type: 'page',
            attrs: {
              id: createdPages[block.id].id
            }
          });
        },
        onLinkToPage: async (linkedPageId, parentNode) => {
          // If the pages hasn't been created already, only then create it
          // Find the parent its linking
          const parentAsLinkedPage = pageIds.find(([notionBlockId]) => notionBlockId === linkedPageId);

          // Make sure its not referencing itself otherwise an infinite loop will occur
          // Also make sure the linked page id is not its parent
          if (linkedPageId && !linkedPages[linkedPageId] && linkedPageId !== blockId && !parentAsLinkedPage) {
            const createdPage = await createPage([...pageIds, [linkedPageId, v4()]]);
            linkedPages[linkedPageId] = createdPage.id;
          }

          let id = linkedPages[linkedPageId];

          // If its linking itself
          if (linkedPageId === blockId) {
            id = createdPageId;
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
      });
    }

    // If there was no content in the notion page only then add an empty paragraph
    if (pageContent.content?.length === 0) {
      pageContent.content?.push({
        type: 'paragraph',
        content: []
      });
    }

    if (pageResponse.parent.type === 'page_id' || pageResponse.parent.type === 'workspace') {
      const title = convertToPlainText((pageResponse.properties.title as any)[pageResponse.properties.title.type]);
      const createdPage = await createPrismaPage({
        content: pageContent,
        headerImage: pageResponse.cover?.type === 'external' ? pageResponse.cover.external.url : null,
        icon: pageResponse.icon?.type === 'emoji' ? pageResponse.icon.emoji : null,
        title,
        pageId: createdPageId,
        spaceId,
        userId
      });

      createdPages[blockId] = createdPage;
      return createdPage;
    }
    else if (pageResponse.parent.type === 'database_id') {
      // The database must be created before the cards can be added
      // eslint-disable-next-line
      const database = createdPages[pageResponse.parent.database_id] ?? await createDatabase(searchResultRecord[pageResponse.parent.database_id] as GetDatabaseResponse, {
        spaceId,
        userId,
        focalboardRecord
      });
      const titleProperty = Object.values(pageResponse.properties).find(value => value.type === 'title')!;
      const emoji = pageResponse.icon?.type === 'emoji' ? pageResponse.icon.emoji : null;

      const title = convertToPlainText(titleProperty.title);
      const cardId = v4();
      const charmTextBlock = createCharmTextBlock({
        parentId: cardId,
        fields: {
          content: pageContent
        }
      });

      const focalboardPropertyRecord = focalboardRecord[database.boardId!];

      const cardProperties: Record<string, any> = {};

      Object.values(pageResponse.properties).forEach(property => {
        if (property[property.type]) {
          if (property.type.match(/(email|number|url|checkbox|phone_number)/)) {
            cardProperties[focalboardPropertyRecord[property.id]] = property[property.type];
          }
          else if (property.type === 'rich_text') {
            cardProperties[focalboardPropertyRecord[property.id]] = convertToPlainText(property[property.type]);
          }
          else if (property.type === 'select') {
            cardProperties[focalboardPropertyRecord[property.id]] = property[property.type].id;
          }
          else if (property.type === 'multi_select') {
            cardProperties[focalboardPropertyRecord[property.id]] = property[property.type]
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
            cardProperties[focalboardPropertyRecord[property.id]] = JSON.stringify(dateValue);
          }
        }
      });

      const commonBlockData = {
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        spaceId,
        createdBy: userId,
        updatedBy: userId
      };

      await prisma.block.createMany({
        data: [{
          ...charmTextBlock,
          ...commonBlockData,
          rootId: database.boardId!
        }, {
          ...createCard({
            title,
            id: cardId,
            parentId: database.boardId!,
            rootId: database.boardId!,
            fields: {
              icon: emoji,
              contentOrder: [charmTextBlock.id],
              headerImage: pageResponse.cover?.type === 'external' ? pageResponse.cover.external.url : null,
              properties: cardProperties
            }
          }),
          ...commonBlockData
        }]
      });
    }

    return createdPages[blockId];
  }

  const workspacePage = await createPrismaPage({
    icon: workspaceIcon,
    spaceId,
    title: workspaceName,
    userId
  });

  // Update parent id for all nested pages
  for (let index = 0; index < searchResults.length; index++) {
    const block = searchResults[index] as GetPageResponse | GetDatabaseResponse;
    if (block.object === 'page' || block.object === 'database') {
      // Check if its a nested page
      if (block.parent.type === 'page_id') {
        createdPages[block.id] = await prisma.page.update({
          where: {
            id: createdPages[block.id].id!
          },
          data: {
            parentId: createdPages[block.parent.page_id].id
          }
        });
      }
      else if (block.parent.type === 'workspace') {
        // Place root pages/databases inside workspace page
        createdPages[block.id] = await prisma.page.update({
          where: {
            id: createdPages[block.id].id!
          },
          data: {
            parentId: workspacePage.id
          }
        });
      }
    }
  }
}
