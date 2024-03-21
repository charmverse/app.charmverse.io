import type { Block } from '@charmverse/core/prisma';

import type { Block as FBBlock } from 'lib/databases/block';
import { replaceS3Domain } from 'lib/utils/url';
import type { ServerBlockFields } from 'pages/api/blocks';

export async function fixBlocks(blocks: FBBlock[]): Promise<FBBlock[]> {
  const OctoUtils = (await import('components/common/DatabaseEditor/octoUtils')).OctoUtils;
  // Hydrate is important, as it ensures that each block is complete to the current model
  const fixedBlocks = OctoUtils.hydrateBlocks(blocks);
  return fixedBlocks;
}

export function blockToFBBlock(block: Block): FBBlock {
  let fields = block.fields as FBBlock['fields'];
  if ('headerImage' in fields) {
    // reassign fields to avoid mutation error
    fields = {
      ...fields,
      headerImage: replaceS3Domain(fields.headerImage)
    };
  }
  return {
    ...block,
    deletedAt: block.deletedAt ? new Date(block.deletedAt).getTime() : 0,
    createdAt: new Date(block.createdAt).getTime(),
    updatedAt: new Date(block.updatedAt).getTime(),
    type: block.type as FBBlock['type'],
    fields
  };
}

export function fbBlockToBlock(fbBlock: FBBlock): Omit<Block, ServerBlockFields> {
  return {
    id: fbBlock.id,
    parentId: fbBlock.parentId,
    rootId: fbBlock.rootId,
    schema: fbBlock.schema,
    type: fbBlock.type,
    title: fbBlock.title,
    fields: fbBlock.fields,
    deletedAt: fbBlock.deletedAt === 0 ? null : fbBlock.deletedAt ? new Date(fbBlock.deletedAt) : null,
    createdAt: !fbBlock.createdAt || fbBlock.createdAt === 0 ? new Date() : new Date(fbBlock.createdAt),
    updatedAt: !fbBlock.updatedAt || fbBlock.updatedAt === 0 ? new Date() : new Date(fbBlock.updatedAt)
  };
}
