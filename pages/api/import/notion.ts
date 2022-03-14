import { Page, Prisma } from '@prisma/client';
import { prisma } from 'db';
import { onError, onNoMatch, requireUser } from 'lib/middleware';
import { withSessionRoute } from 'lib/session/withSession';
import { NextApiRequest, NextApiResponse } from 'next';
import nc from 'next-connect';
import { Client } from '@notionhq/client';
import { BlockNode, CalloutNode, CodeNode, ListItemNode, PageContent, TableNode, TableRowNode, TextContent, TextMark } from 'models';
import { ListBlockChildrenParameters, ListBlockChildrenResponse } from '@notionhq/client/build/src/api-endpoints';
import { MIN_EMBED_WIDTH, MAX_EMBED_WIDTH, VIDEO_ASPECT_RATIO, extractEmbedLink, MIN_EMBED_HEIGHT } from 'components/editor/ResizableIframe';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'components/editor/ResizableImage';

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
  results: BlockObjectResponse[],
  next_cursor: string | null
}

type BlockWithChildren = BlockObjectResponse & {children: string[]};

const BlocksWithChildrenRegex = /(table|bulleted_list_item|callout|numbered_list_item|to_do|quote)/;

async function importFromNotion (req: NextApiRequest, res: NextApiResponse<{error: string} |
  {root: Page, pages: Page[]}>) {
  const blockId = process.env.NOTION_PAGE_ID!;
  const userId = req.session.user.id;
  const { spaceId } = req.body as {spaceId: string};

  const blockRetrieveResponse = await notion.blocks.retrieve({
    block_id: blockId
  }) as BlockObjectResponse;

  const createdPages: Record<string, Page> = {};
  const linkedPages: Record<string, string> = {};

  async function populateDoc (
    parentNode: BlockNode,
    block: BlockWithChildren,
    blocksRecord: Record<string, BlockWithChildren>
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
        // TODO: Link could also be created for a database
        const linkedPageId = block[block.type].type === 'page_id' ? (block[block.type] as any).page_id : null;
        // If the pages hasn't been created already, only then create it
        if (linkedPageId && !linkedPages[linkedPageId]) {
          const createdPage = await createPage(linkedPageId);
          linkedPages[linkedPageId] = createdPage.id;
        }

        (parentNode as PageContent).content?.push({
          type: 'page',
          attrs: {
            id: linkedPages[linkedPageId]
          }
        });
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
          // eslint-disable-next-line
          await populateDoc(listItemNode, blocksRecord[childId], blocksRecord);
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
          // eslint-disable-next-line
          await populateDoc(calloutNode, blocksRecord[childId], blocksRecord);
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

  async function createPage (pageId: string) {
    // eslint-disable-next-line
    const pageResponse = await notion.pages.retrieve({
      page_id: pageId
    }) as unknown as GetPageResponse;

    const blocksRecord: Record<string, BlockWithChildren> = {};
    const blocks: BlockWithChildren[] = [];
    const pageContent: PageContent = {
      type: 'doc',
      content: []
    };

    // Array to store parameters for further requests to retrieve children blocks
    let blockChildrenRequests: ListBlockChildrenParameters[] = [{
      block_id: pageId,
      page_size: 100
    }];

    async function getChildBlockListResponses () {
      // eslint-disable-next-line
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
            page_size: 100,
            start_cursor: childBlockListResponse.next_cursor ?? undefined
          });
        }
      });

      return childBlockListResponses;
    }

    // Fetch 5 level of nested content
    for (let depth = 0; depth < 5; depth++) {
      if (blockChildrenRequests.length !== 0) {
        // eslint-disable-next-line
          const childBlockListResponses = await getChildBlockListResponses();

        // If the block has more child to be fetch, fetch them using the cursor
        while (blockChildrenRequests.length !== 0) {
          // eslint-disable-next-line
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

    for (let index = 0; index < blocks.length; index++) {
      const block = blocks[index];
      // eslint-disable-next-line
      await populateDoc(pageContent, block, blocksRecord);
    }

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
      headerImage: pageResponse.cover?.type === 'external' ? pageResponse.cover.external.url : null,
      icon: pageResponse.icon?.type === 'emoji' ? pageResponse.icon.emoji : null,
      title: pageResponse.properties.title.type === 'title' ? pageResponse.properties.title.title.reduce((prev, cur) => prev + cur.plain_text, '') : pageResponse.properties.title.rich_text.reduce((prev, cur) => prev + cur.plain_text, ''),
      type: 'page'
    };

    // eslint-disable-next-line
    const page = await prisma.page.create({ data: pageToCreate });
    createdPages[pageId] = page;
    return page;
  }

  if (blockRetrieveResponse.type === 'child_page') {
    await createPage(blockId);

    return res.status(200).json({
      root: createdPages[blockId],
      pages: Object.values(createdPages)
    });
  }
  else if (blockRetrieveResponse.type === 'child_database') {
    return res.status(400).json({
      error: 'The block is neither a page nor a database.'
    });
  }
  else {
    return res.status(400).json({
      error: 'The block is neither a page nor a database.'
    });
  }
}

export default withSessionRoute(handler);
