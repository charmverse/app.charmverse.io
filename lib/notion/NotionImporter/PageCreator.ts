import { v4 } from 'uuid';

import type { DisclosureDetailsNode, PageContent } from 'models';

import { convertRichText } from '../convertRichText';
import { createPrismaPage } from '../createPrismaPage';
import type { BlocksRecord, BlockWithChildren } from '../types';

export class PageCreator {
  blocksRecord: BlocksRecord;

  firstLevelBlocks: string[];

  notionPageId: string;

  constructor({
    blocksRecord,
    firstLevelBlocks,
    notionPageId
  }: {
    blocksRecord: BlocksRecord;
    firstLevelBlocks: string[];
    notionPageId: string;
  }) {
    this.blocksRecord = blocksRecord;
    this.firstLevelBlocks = firstLevelBlocks;
    this.notionPageId = notionPageId;
  }

  async create({
    spaceId,
    userId,
    parentId,
    title,
    icon
  }: {
    title: string;
    icon: string;
    parentId: string;
    spaceId: string;
    userId: string;
  }) {
    const pageContent: PageContent = {
      type: 'doc',
      content: []
    };

    const createdPageId = v4();
    for (const firstLevelBlockId of this.firstLevelBlocks) {
      const blockNode = await this.populatePage(this.blocksRecord[firstLevelBlockId]);
      if (blockNode) {
        pageContent.content?.push(blockNode);
      }
    }

    return createPrismaPage({
      id: createdPageId,
      content: pageContent,
      spaceId,
      createdBy: userId,
      title,
      icon,
      parentId
    });
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
        default: {
          break;
        }
      }
    } catch (err) {
      //
    }
  }
}
