import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Client } from '@notionhq/client';
import { PageContent, TableNode, TableRowNode, TextContent, TextMark } from 'models';
import { ListBlockChildrenParameters, ListBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints';

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

interface SecondLevelChildBlockResponse {
  request: ListBlockChildrenParameters,
  results: BlockObjectResponse[]
}

async function importFromNotion (req: NextApiRequest, res: NextApiResponse<Page>) {
  const blockId = process.env.NOTION_PAGE_ID!;
  const userId = req.session.user.id;
  const { spaceId } = req.body as {spaceId: string};
  const pageResponse = await notion.pages.retrieve({
    page_id: blockId
  }) as unknown as GetPageResponse;

  const blockChildrenResponse = await notion.blocks.children.list({
    block_id: blockId,
    page_size: 100
  }) as unknown as {results: BlockObjectResponse[]};

  const pageContent: PageContent = {
    type: 'doc',
    content: []
  };

  const blocksRecord: Record<string, BlockObjectResponse & {children: string[]}> = {};
  const blocks: BlockObjectResponse[] = [];

  // Array to store parameters for further requests
  const blockChildrenRequests: ListBlockChildrenParameters[] = [];

  blockChildrenResponse.results.forEach((result) => {
    // If its a table we need to get its children content
    if (result.type === 'table' && result.has_children) {
      blockChildrenRequests.push({
        block_id: result.id,
        page_size: 100
      });
    }

    const blockWithChildren = {
      ...result,
      children: []
    };
    blocksRecord[result.id] = blockWithChildren;
    blocks.push(blockWithChildren);
  });

  const secondLevelChildBlockResponses = (await Promise.all<SecondLevelChildBlockResponse>(
    blockChildrenRequests.map(blockChildrenRequest => new Promise((resolve) => {
      notion.blocks.children.list(blockChildrenRequest).then((response => resolve({
        results: response.results as BlockObjectResponse[],
        request: blockChildrenRequest
      })));
    }))
  ));

  secondLevelChildBlockResponses.forEach((secondLevelChildBlockResponse) => {
    secondLevelChildBlockResponse.results.forEach((result) => {
      const blockWithChildren = {
        ...result,
        children: []
      };
      blocksRecord[result.id] = blockWithChildren;
      blocks.push(blockWithChildren);
      blocksRecord[secondLevelChildBlockResponse.request.block_id].children.push(result.id);
    });
  });

  blocks.forEach((result) => {
    if (result.type === 'heading_1') {
      pageContent.content?.push({
        type: 'heading',
        attrs: {
          level: 1
        },
        content: convertRichText(result.heading_1.rich_text)
      });
    }
    else if (result.type === 'heading_2') {
      pageContent.content?.push({
        type: 'heading',
        attrs: {
          level: 2
        },
        content: convertRichText(result.heading_2.rich_text)
      });
    }
    else if (result.type === 'heading_3') {
      pageContent.content?.push({
        type: 'heading',
        attrs: {
          level: 3
        },
        content: convertRichText(result.heading_3.rich_text)
      });
    }
    else if (result.type === 'paragraph') {
      pageContent.content?.push({
        type: 'paragraph',
        content: convertRichText(result[result.type].rich_text)
      });
    }
    else if (result.type === 'table') {
      const tableNode: TableNode = {
        type: 'table',
        content: []
      };
      blocksRecord[result.id].children?.forEach((rowId: string, rowIndex: number) => {
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
      pageContent.content?.push(tableNode);
    }
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
