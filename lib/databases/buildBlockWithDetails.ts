import type { Block, Page } from '@charmverse/core/prisma';

import type { BlockWithDetails } from './block';

// mutative method, for performance reasons
export function buildBlockWithDetails(
  block: Block,
  page: Pick<Page, 'title' | 'updatedBy' | 'updatedAt' | 'type' | 'id'>
): BlockWithDetails {
  const blockWithDetails = block as BlockWithDetails;
  blockWithDetails.pageId = page?.id;
  blockWithDetails.icon = page?.title || block.title;
  blockWithDetails.hasContent = true; // not really necesssary to show this, which requires retrieving all content columns
  blockWithDetails.title = page?.title || block.title;
  blockWithDetails.pageType = page?.type;
  blockWithDetails.updatedAt = page?.updatedAt || block.updatedAt;
  blockWithDetails.updatedBy = page?.updatedBy || block.updatedBy;
  return blockWithDetails;
}
