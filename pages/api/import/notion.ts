import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Client } from '@notionhq/client';
import { BlockNode, ListItemNode, PageContent, TableNode, TableRowNode, TextContent, TextMark } from 'models';
import { ListBlockChildrenParameters } from '@notionhq/client/build/src/api-endpoints';

const notion = new Client({ auth: process.env.NOTION_API_KEY });

const handler = nc<NextApiRequest, NextApiResponse>({ onError, onNoMatch });

handler.use(requireUser).post(importFromNotion);

type RichTextItemResponse = {
  type: 'text';
  text: {
      content: string;
      link: {
          url: string;
      } | null;
  };
  annotations: {
      bold: boolean;
      italic: boolean;
      strikethrough: boolean;
      underline: boolean;
      code: boolean;
      color: 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red' | 'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background' | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background';
  };
  plain_text: string;
  href: string | null;
};

type GetPageResponse = {
  parent: {
      type: 'database_id';
      database_id: string;
  } | {
      type: 'page_id';
      page_id: string;
  } | {
      type: 'workspace';
      workspace: true;
  };
  properties: Record<string, {
      type: 'title';
      title: Array<RichTextItemResponse>;
      id: string;
  } | {
      type: 'rich_text';
      rich_text: Array<RichTextItemResponse>;
      id: string;
    }
  >;
  icon: {
      type: 'emoji';
      emoji: string;
  } | null | {
      type: 'external';
      external: {
          url: string;
      };
  } | null | {
      type: 'file';
      file: {
          url: string;
          expiry_time: string;
      };
  } | null;
  cover: {
      type: 'external';
      external: {
          url: string;
      };
  } | null | {
      type: 'file';
      file: {
          url: string;
          expiry_time: string;
      };
  } | null;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_by: {
      id: string;
      object: 'user';
  };
  object: 'page';
  id: string;
  created_time: string;
  last_edited_time: string;
  archived: boolean;
  url: string;
}

type ApiColor = 'default' | 'gray' | 'brown' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'red' | 'gray_background' | 'brown_background' | 'orange_background' | 'yellow_background' | 'green_background' | 'blue_background' | 'purple_background' | 'pink_background' | 'red_background';

type BlockObjectResponse = {
  type: 'paragraph';
  paragraph: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'heading_1';
  heading_1: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'heading_2';
  heading_2: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'heading_3';
  heading_3: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'bulleted_list_item';
  bulleted_list_item: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'numbered_list_item';
  numbered_list_item: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'quote';
  quote: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'to_do';
  to_do: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
      checked: boolean;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'toggle';
  toggle: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'template';
  template: {
      rich_text: Array<RichTextItemResponse>;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'synced_block';
  synced_block: {
      synced_from: {
          type: 'block_id';
          block_id: string;
      } | null;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'child_page';
  child_page: {
      title: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'child_database';
  child_database: {
      title: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'equation';
  equation: {
      expression: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'code';
  code: {
      rich_text: Array<RichTextItemResponse>;
      caption: Array<RichTextItemResponse>;
      language: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'callout';
  callout: {
      rich_text: Array<RichTextItemResponse>;
      color: ApiColor;
      icon: {
          type: 'emoji';
          emoji: string;
      } | null | {
          type: 'external';
          external: {
              url: string;
          };
      } | null | {
          type: 'file';
          file: {
              url: string;
              expiry_time: string;
          };
      } | null;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'divider';
  divider: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'breadcrumb';
  breadcrumb: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'table_of_contents';
  table_of_contents: {
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'column_list';
  column_list: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'column';
  column: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'link_to_page';
  link_to_page: {
      type: 'page_id';
      page_id: string;
  } | {
      type: 'database_id';
      database_id: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'table';
  table: {
      has_column_header: boolean;
      has_row_header: boolean;
      table_width: number;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'table_row';
  table_row: {
      cells: Array<Array<RichTextItemResponse>>;
      color: ApiColor;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'embed';
  embed: {
      url: string;
      caption: Array<RichTextItemResponse>;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'bookmark';
  bookmark: {
      url: string;
      caption: Array<RichTextItemResponse>;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'image';
  image: {
      type: 'external';
      external: {
          url: string;
      };
      caption: Array<RichTextItemResponse>;
  } | {
      type: 'file';
      file: {
          url: string;
          expiry_time: string;
      };
      caption: Array<RichTextItemResponse>;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'video';
  video: {
      type: 'external';
      external: {
          url: string;
      };
      caption: Array<RichTextItemResponse>;
  } | {
      type: 'file';
      file: {
          url: string;
          expiry_time: string;
      };
      caption: Array<RichTextItemResponse>;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'pdf';
  pdf: {
      type: 'external';
      external: {
          url: string;
      };
      caption: Array<RichTextItemResponse>;
  } | {
      type: 'file';
      file: {
          url: string;
          expiry_time: string;
      };
      caption: Array<RichTextItemResponse>;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'file';
  file: {
      type: 'external';
      external: {
          url: string;
      };
      caption: Array<RichTextItemResponse>;
  } | {
      type: 'file';
      file: {
          url: string;
          expiry_time: string;
      };
      caption: Array<RichTextItemResponse>;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'audio';
  audio: {
      type: 'external';
      external: {
          url: string;
      };
      caption: Array<RichTextItemResponse>;
  } | {
      type: 'file';
      file: {
          url: string;
          expiry_time: string;
      };
      caption: Array<RichTextItemResponse>;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'link_preview';
  link_preview: {
      url: string;
  };
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
} | {
  type: 'unsupported';
  unsupported: Record<string, never>;
  object: 'block';
  id: string;
  created_time: string;
  created_by: {
      id: string;
      object: 'user';
  };
  last_edited_time: string;
  last_edited_by: {
      id: string;
      object: 'user';
  };
  has_children: boolean;
  archived: boolean;
};

function convertRichText (richTexts: RichTextItemResponse[]): TextContent[] {
  return richTexts.map((richText) => {
    const marks: {type: string, attrs?: Record<string, string>}[] = [];
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
      marks.push({ type: 'link',
        attrs: {
          href: richText.href
        } });
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
  results: BlockObjectResponse[]
}

type BlockWithChildren = BlockObjectResponse & {children: string[]};

async function importFromNotion (req: NextApiRequest, res: NextApiResponse<Page>) {
  const blockId = process.env.NOTION_PAGE_ID!;
  const userId = req.session.user.id;
  const { spaceId } = req.body as {spaceId: string};
  const pageResponse = await notion.pages.retrieve({
    page_id: blockId
  }) as unknown as GetPageResponse;

  const blocksRecord: Record<string, BlockWithChildren> = {};
  const blocks: BlockWithChildren[] = [];
  const pageContent: PageContent = {
    type: 'doc',
    content: []
  };

  // Array to store parameters for further requests to retrieve children blocks
  let blockChildrenRequests: ListBlockChildrenParameters[] = [{
    block_id: blockId,
    page_size: 100
  }];

  for (let depth = 0; depth < 10; depth++) {
    if (blockChildrenRequests.length !== 0) {
      // eslint-disable-next-line
      const childBlockListResponses = (await Promise.all<ChildBlockListResponse>(
        blockChildrenRequests.map(blockChildrenRequest => new Promise((resolve) => {
          notion.blocks.children.list(blockChildrenRequest).then((response => resolve({
            results: response.results as BlockObjectResponse[],
            request: blockChildrenRequest
          })));
        }))
      ));

      blockChildrenRequests = [];

      // eslint-disable-next-line
      childBlockListResponses.forEach((childBlockListResponse) => {
        childBlockListResponse.results.forEach((block) => {
          const blockWithChildren = {
            ...block,
            children: []
          };
          blocksRecord[block.id] = blockWithChildren;
          if (depth !== 0) {
            blocksRecord[childBlockListResponse.request.block_id].children.push(block.id);
          }
          else {
            // Only push the top level blocks to the array
            blocks.push(blockWithChildren);
          }

          if (block.type.match(/(table|bulleted_list_item|callout|numbered_list_item)/) && block.has_children) {
            blockChildrenRequests.push({
              block_id: block.id,
              page_size: 100
            });
          }
        });
      });
    }
    else {
      break;
    }
  }

  function populateDoc (parentNode: BlockNode, block: BlockWithChildren) {
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

      case 'bulleted_list_item': {
        const listItemNode: ListItemNode = {
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: convertRichText(block.bulleted_list_item.rich_text)
          }]
        };

        (parentNode as PageContent).content?.push({
          type: 'bulletList',
          content: [listItemNode]
        });

        blocksRecord[block.id].children.forEach((childId) => {
          populateDoc(listItemNode, blocksRecord[childId]);
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

  blocks.forEach(block => {
    populateDoc(pageContent, block);
  });

  // If there was no content in the notion page only then add an empty paragraph
  if (pageContent.content?.length === 0) {
    pageContent.content?.push({
      type: 'paragraph',
      content: []
    });
  }

  const id = Math.random().toString().replace('0.', '');

  const pageToCreate: Prisma.PageCreateInput = {
    content: pageContent,
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
    headerImage: pageResponse.cover?.type === 'external' ? pageResponse.cover.external.url : null,
    icon: pageResponse.icon?.type === 'emoji' ? pageResponse.icon.emoji : null,
    title: pageResponse.properties.title.type === 'title' ? pageResponse.properties.title.title.reduce((prev, cur) => prev + cur.plain_text, '') : pageResponse.properties.title.rich_text.reduce((prev, cur) => prev + cur.plain_text, ''),
    type: 'page'
  };

  const createdPage = await prisma.page.create({ data: pageToCreate });

  return res.status(200).json(createdPage);
}

export default withSessionRoute(handler);
