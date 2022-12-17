import {
  MIN_EMBED_WIDTH,
  MAX_EMBED_WIDTH,
  MIN_EMBED_HEIGHT
} from 'components/common/CharmEditor/components/iframe/config';
import { VIDEO_ASPECT_RATIO } from 'components/common/CharmEditor/components/video/videoSpec';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from 'lib/prosemirror/plugins/image/constants';
import type {
  TextContent,
  MentionNode,
  DisclosureDetailsNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  ColumnLayoutNode,
  ColumnBlockNode
} from 'models';

import { convertRichText } from '../convertRichText';
import { getPersistentImageUrl } from '../getPersistentImageUrl';
import type { BlockWithChildren, RichTextItemResponse } from '../types';

import type { CharmversePage } from './CharmversePage';

export class NotionBlock {
  charmversePage: CharmversePage;

  constructor({ charmversePage }: { charmversePage: CharmversePage }) {
    this.charmversePage = charmversePage;
  }

  private async populatePageContent({
    childIds = [],
    contents = []
  }: {
    contents?: (TextContent | MentionNode)[];
    childIds?: string[];
  }) {
    const childContent: any[] = [];
    const modifiedContent: (MentionNode | TextContent)[] = [...contents];
    for (let index = 0; index < childIds.length; index++) {
      const blockNode = (await this.convert(this.charmversePage.blocksRecord[childIds[index]])) as any;
      if (blockNode) {
        childContent.push(blockNode);
      }
    }

    for (let index = 0; index < contents.length; index++) {
      if (contents[index].type === 'mention') {
        const mentionNode = contents[index] as MentionNode;
        if (mentionNode.attrs.type === 'page') {
          try {
            const createdPage = await this.charmversePage.fetcher.fetchAndCreatePage({
              notionPageId: mentionNode.attrs.value
            });
            modifiedContent[index] = {
              attrs: {
                type: 'page',
                value: createdPage.id
              },
              type: 'mention'
            };
          } catch (err) {
            // console.log(err);
          }
        }
      }
    }

    return { childContent, content: modifiedContent };
  }

  async convert(block: BlockWithChildren) {
    try {
      switch (block.type) {
        case 'heading_1':
        case 'heading_2':
        case 'heading_3': {
          const level = Number(block.type.split('_')[1]);
          const contents = convertRichText((block as any)[block.type].rich_text);
          const childIds = block.children;
          const { childContent, content } = await this.populatePageContent({ childIds, contents });

          if (childIds.length !== 0) {
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
                      content
                    }
                  ]
                },
                ...childContent
              ]
            };
            return disclosureDetailsNode;
          } else {
            return {
              type: 'heading',
              attrs: {
                level
              },
              content
            };
          }
        }
        case 'toggle': {
          const contents = convertRichText(block.toggle.rich_text);
          const childIds = block.children;
          const { childContent, content } = await this.populatePageContent({ childIds, contents });

          const disclosureDetailsNode: DisclosureDetailsNode = {
            type: 'disclosureDetails',
            content: [
              {
                type: 'disclosureSummary',
                content: [
                  {
                    type: 'paragraph',
                    content
                  }
                ]
              },
              ...childContent
            ]
          };

          return disclosureDetailsNode;
        }

        case 'paragraph': {
          const contents = convertRichText(block[block.type].rich_text);
          const { content } = await this.populatePageContent({ contents });
          return {
            type: 'paragraph',
            content
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

          const contents = convertRichText(richText);
          const childIds = block.children;
          const { childContent, content } = await this.populatePageContent({ childIds, contents });

          const listItemNode: ListItemNode = {
            type: 'listItem',
            content: [
              {
                type: 'paragraph',
                content
              },
              ...childContent
            ],
            attrs: {
              todoChecked: block.type === 'to_do' ? block.to_do.checked : null
            }
          };

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
          const contents = convertRichText(richText);
          const childIds = block.children;
          const { childContent, content } = await this.populatePageContent({ childIds, contents });

          const calloutNode = {
            type: block.type === 'callout' ? 'blockquote' : ('quote' as any),
            attrs: {
              emoji
            },
            content: [
              {
                type: 'paragraph',
                content
              },
              ...childContent
            ]
          };

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
          const persistentUrl = await getPersistentImageUrl({
            image: block.image,
            spaceId: this.charmversePage.fetcher.spaceId
          });
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

          for (let index = 0; index < this.charmversePage.blocksRecord[block.id].children.length; index++) {
            const rowId = this.charmversePage.blocksRecord[block.id].children[index];
            const row = this.charmversePage.blocksRecord[rowId];
            if (row.type === 'table_row') {
              const content: TableRowNode['content'] = [];
              tableNode.content.push({
                type: 'table_row',
                content
              });
              for (const cell of row.table_row.cells) {
                const contents = convertRichText(cell);
                const { content: tableRowContent } = await this.populatePageContent({ contents });

                content.push({
                  type: index === 0 ? 'table_header' : 'table_cell',
                  content: tableRowContent
                });
              }
            }
          }
          return tableNode;
        }

        case 'column_list': {
          const childIds = block.children;
          const { childContent } = await this.populatePageContent({ childIds });
          const columnLayoutNode: ColumnLayoutNode = {
            type: 'columnLayout',
            content: childContent
          };

          return columnLayoutNode;
        }

        case 'column': {
          const childIds = block.children;
          const { childContent } = await this.populatePageContent({ childIds });

          const columnBlockNode: ColumnBlockNode = {
            type: 'columnBlock',
            // This empty paragraph is necessary, otherwise charmeditor throws an error
            content: [
              {
                type: 'paragraph',
                content: childContent
              }
            ]
          };

          return columnBlockNode;
        }

        case 'link_to_page': {
          const linkedPageId =
            block.link_to_page.type === 'page_id' ? block.link_to_page.page_id : block.link_to_page.database_id;
          if (linkedPageId === this.charmversePage.notionPageId) {
            return {
              type: 'page',
              attrs: {
                id: this.charmversePage.charmversePageId
              }
            };
          }
          const charmversePage = await this.charmversePage.fetcher.fetchAndCreatePage({
            notionPageId: linkedPageId
          });
          return {
            type: 'page',
            attrs: {
              id: charmversePage?.id
            }
          };
        }

        case 'child_database':
        case 'child_page': {
          const charmversePage = await this.charmversePage.fetcher.fetchAndCreatePage({
            notionPageId: block.id
          });

          return {
            type: 'page',
            attrs: {
              id: charmversePage?.id
            }
          };
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
