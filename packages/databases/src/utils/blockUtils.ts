import type { UIBlockWithDetails, BlockWithDetails } from '@packages/databases/block';
import { OctoUtils } from '@packages/databases/octoUtils';
import { replaceS3Domain } from '@packages/utils/url';

export type ServerBlockFields = 'spaceId' | 'updatedBy' | 'createdBy';

export function fixBlocks(blocks: UIBlockWithDetails[]): UIBlockWithDetails[] {
  // Hydrate is important, as it ensures that each block is complete to the current model
  const fixedBlocks = OctoUtils.hydrateBlocks(blocks);
  return fixedBlocks;
}

export function blockToFBBlock(block: BlockWithDetails): UIBlockWithDetails {
  let fields = block.fields as UIBlockWithDetails['fields'];
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
    title: block.title || '',
    type: block.type as UIBlockWithDetails['type'],
    fields
  };
}

export function fbBlockToBlock(fbBlock: UIBlockWithDetails): Omit<BlockWithDetails, ServerBlockFields> {
  return {
    id: fbBlock.id,
    parentId: fbBlock.parentId,
    rootId: fbBlock.rootId,
    type: fbBlock.type,
    title: fbBlock.title,
    fields: fbBlock.fields,
    deletedAt: fbBlock.deletedAt === 0 ? null : fbBlock.deletedAt ? new Date(fbBlock.deletedAt) : null,
    createdAt: !fbBlock.createdAt || fbBlock.createdAt === 0 ? new Date() : new Date(fbBlock.createdAt),
    updatedAt: !fbBlock.updatedAt || fbBlock.updatedAt === 0 ? new Date() : new Date(fbBlock.updatedAt)
  };
}
