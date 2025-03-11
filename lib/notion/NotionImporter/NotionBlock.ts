import { log } from '@charmverse/core/log';
import type { PageObjectResponse, RichTextItemResponse } from '@notionhq/client/build/src/api-endpoints';
import { isTruthy } from '@packages/utils/types';
import { isPdfEmbedLink } from '@root/lib/pdf/extractPdfEmbedLink';
import type {
  TextContent,
  MentionNode,
  DisclosureDetailsNode,
  ListItemNode,
  TableNode,
  TableRowNode,
  ColumnLayoutNode,
  ColumnBlockNode,
  TextMark
} from '@root/lib/prosemirror/interfaces';
import { MAX_IMAGE_WIDTH, MIN_IMAGE_WIDTH } from '@root/lib/prosemirror/plugins/image/constants';

import {
  MIN_EMBED_WIDTH,
  MAX_EMBED_WIDTH,
  MIN_EMBED_HEIGHT
} from 'components/common/CharmEditor/components/iframe/config';
import { extractAttrsFromUrl as extractNFTAttrs } from 'components/common/CharmEditor/components/nft/utils';
import { extractTweetAttrs } from 'components/common/CharmEditor/components/tweet/tweetSpec';
import { extractYoutubeLinkType } from 'components/common/CharmEditor/components/video/utils';
import { VIDEO_ASPECT_RATIO } from 'components/common/CharmEditor/components/video/videoSpec';

import { convertRichText } from '../convertRichText';
import { getPageTitleText } from '../getPageTitle';
import { getPersistentImageUrl } from '../getPersistentImageUrl';
import type { BlockWithChildren, BlocksRecord } from '../interfaces';

import type { CharmversePage } from './CharmversePage';
import type { NotionPage } from './NotionPage';

export class NotionBlock {
  charmversePage: CharmversePage;

  notionPage: NotionPage;

  blocksRecord: BlocksRecord;

  constructor({
    blocksRecord,
    charmversePage,
    notionPage
  }: {
    blocksRecord: BlocksRecord;
    notionPage: NotionPage;
    charmversePage: CharmversePage;
  }) {
    this.charmversePage = charmversePage;
    this.notionPage = notionPage;
    this.blocksRecord = blocksRecord;
  }

  private async populatePageContent({
    childIds = [],
    contents = []
  }: {
    contents?: (TextContent | MentionNode)[];
    childIds?: string[];
  }) {
    const childContent: any[] = childIds.length !== 0 ? await this.convertBlocks(childIds) : [];
    const modifiedContent: (MentionNode | TextContent)[] = [...contents];

    for (let index = 0; index < contents.length; index++) {
      if (contents[index].type === 'mention') {
        const mentionNode = contents[index] as MentionNode;
        if (mentionNode.attrs.type === 'page') {
          const createdPage = await this.notionPage.fetchAndCreatePage({
            notionPageId: mentionNode.attrs.value
          });
          if (createdPage) {
            modifiedContent[index] = {
              attrs: {
                type: 'page',
                value: createdPage.id
              },
              type: 'mention'
            };
          }
        }
      } else if (contents[index].type === 'text') {
        const textContent = contents[index] as TextContent;
        const marks: TextMark[] = [];
        if (textContent.marks) {
          for (let textContentMarkIndex = 0; textContentMarkIndex < textContent.marks.length; textContentMarkIndex++) {
            const mark = textContent.marks[textContentMarkIndex];
            if (mark.attrs && mark.type === 'link') {
              // If its linking to an internal page
              if (mark.attrs.href.startsWith('/')) {
                const notionPageLink = mark.attrs.href.slice(1);
                const notionPageId = [
                  notionPageLink.substring(0, 8),
                  notionPageLink.substring(8, 12),
                  notionPageLink.substring(12, 16),
                  notionPageLink.substring(16, 20),
                  notionPageLink.substring(20)
                ].join('-');
                const charmversePage = await this.notionPage.fetchAndCreatePage({
                  notionPageId
                });
                if (charmversePage) {
                  mark.attrs.href = charmversePage.path;
                  marks.push(mark);
                } else {
                  // Skip adding link mark as the charmverse page was not created
                  // Most likely the integration doesn't have access to the page
                }
              } else {
                marks.push(mark);
              }
            } else {
              marks.push(mark);
            }
          }
        }

        textContent.marks = marks;
      }
    }

    return { childContent, content: modifiedContent };
  }

  async convertBlocks(blockIds: string[]) {
    const convertedBlocks: any[] = [];
    let block;
    for (let i = 0; i < blockIds.length; i++) {
      try {
        block = this.blocksRecord[blockIds[i]];
        // list items are continuous thus check for the rest blocks and put them inside same node
        if (block.type === 'bulleted_list_item' || block.type === 'numbered_list_item' || block.type === 'to_do') {
          const listItemBlock = block;
          const convertedBlock = await this.convert(block);
          const listItem = {
            type: block.type === 'numbered_list_item' ? 'ordered_list' : 'bullet_list',
            content: convertedBlock ? [convertedBlock] : []
          } as any;

          // eslint-disable-next-line
          while (true) {
            i += 1;
            if (i < blockIds.length) {
              block = this.blocksRecord[blockIds[i]];
              const charmverseBlock = await this.convert(block);
              if (block.type !== listItemBlock.type) {
                // Negate to process the current block again
                i -= 1;
                break;
              } else if (charmverseBlock) {
                listItem.content.push(charmverseBlock);
              }
            } else {
              break;
            }
          }
          convertedBlocks?.push(listItem);
        } else if (block.type === 'synced_block') {
          convertedBlocks?.push(...(await this.convertBlocks(block.children)).filter(isTruthy));
        } else {
          const charmverseBlock = await this.convert(block);
          if (charmverseBlock) {
            convertedBlocks?.push(charmverseBlock);
          }
        }
      } catch (err) {
        if (block) {
          log.warn(`[notion] Failed to convert notion ${block.type}:${block.id} block to charmverse block`, {
            block,
            spaceId: this.notionPage.spaceId,
            userId: this.notionPage.userId,
            error: err
          });
          const notionPage = this.notionPage.cache.notionPagesRecord[
            this.charmversePage.notionPageId
          ] as PageObjectResponse;
          const failedImportsRecord = this.notionPage.cache.failedImportsRecord[block.id];
          if (!failedImportsRecord) {
            this.notionPage.cache.failedImportsRecord[block.id] = {
              blocks: [[block.id, block.type]],
              pageId: this.charmversePage.notionPageId,
              title: getPageTitleText(notionPage),
              type: notionPage.object
            };
          } else {
            this.notionPage.cache.failedImportsRecord[block.id] = {
              ...failedImportsRecord,
              blocks: [...failedImportsRecord.blocks, [block.id, block.type]]
            };
          }
        } else {
          log.warn('[notion] Error when converting blocks for a page', {
            spaceId: this.notionPage.spaceId,
            userId: this.notionPage.userId,
            error: err,
            blockIds
          });
        }
      }
    }

    return convertedBlocks;
  }

  async convert(block: BlockWithChildren) {
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
          type: 'list_item',
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

        return listItemNode;
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
          type: 'video',
          attrs: {
            src: block.video.type === 'external' ? block.video.external.url : null,
            width: MAX_EMBED_WIDTH,
            height: MAX_EMBED_WIDTH / VIDEO_ASPECT_RATIO
          }
        };
      }

      case 'embed':
      case 'bookmark': {
        const url = block.type === 'bookmark' ? block.bookmark.url : block.embed.url;
        const tweetAttrs = extractTweetAttrs(url);
        const nftAttrs = extractNFTAttrs(url);
        const isYoutube = extractYoutubeLinkType(url);
        const isPdf = isPdfEmbedLink(url);

        if (tweetAttrs) {
          return {
            type: 'tweet',
            attrs: {
              screenName: tweetAttrs.screenName,
              id: tweetAttrs.id
            }
          };
        } else if (nftAttrs) {
          return {
            type: 'nft',
            attrs: {
              chain: nftAttrs.chain,
              token: nftAttrs.token,
              contract: nftAttrs.contract
            }
          };
        } else if (isYoutube) {
          return {
            type: 'video',
            attrs: {
              src: url,
              width: MAX_EMBED_WIDTH,
              height: MAX_EMBED_WIDTH / VIDEO_ASPECT_RATIO
            }
          };
        } else if (block.type === 'bookmark') {
          return {
            type: 'bookmark',
            attrs: {
              url
            }
          };
        } else if (isPdf) {
          return {
            type: 'pdf',
            attrs: {
              url
            }
          };
        }

        return {
          type: 'iframe',
          attrs: {
            src: url,
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
          spaceId: this.notionPage.spaceId
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
          content: childContent
        };

        return columnBlockNode;
      }

      case 'link_to_page': {
        const linkedPageId =
          block.link_to_page.type === 'page_id'
            ? block.link_to_page.page_id
            : block.link_to_page.type === 'database_id'
              ? block.link_to_page.database_id
              : null;
        if (linkedPageId === this.charmversePage.notionPageId) {
          return {
            type: 'linkedPage',
            attrs: {
              id: this.charmversePage.charmversePageId
            }
          };
        }

        if (linkedPageId) {
          const charmversePage = await this.notionPage.fetchAndCreatePage({
            notionPageId: linkedPageId
          });
          if (charmversePage) {
            return {
              type: 'linkedPage',
              attrs: {
                id: charmversePage.id,
                type: charmversePage.type,
                path: charmversePage.path
              }
            };
          }
          return null;
        }
        return null;
      }

      case 'child_database':
      case 'child_page': {
        const charmversePage = await this.notionPage.fetchAndCreatePage({
          notionPageId: block.id
        });
        // Notion api doesn't support linked databases. See: https://developers.notion.com/reference/retrieve-a-database
        if (!charmversePage && block.type === 'child_database') {
          return {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: '[Linked database could not be imported]'
              }
            ]
          };
        }
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
  }
}
