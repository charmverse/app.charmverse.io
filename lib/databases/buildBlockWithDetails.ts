import type { Block, Page } from '@charmverse/core/prisma';

import type { BlockWithDetails } from './block';

// mutative method, for performance reasons
export function buildBlockWithDetails(
  block: Block,
  page: Pick<Page, 'title' | 'hasContent' | 'updatedBy' | 'updatedAt' | 'type' | 'id' | 'bountyId'>
): BlockWithDetails {
  const blockWithDetails = block as BlockWithDetails;
  blockWithDetails.bountyId = page.bountyId || undefined;
  blockWithDetails.pageId = page.id;
  blockWithDetails.icon = page.title || block.title;
  blockWithDetails.hasContent = page.hasContent;
  blockWithDetails.title = page.title || block.title;
  blockWithDetails.pageType = page.type;
  blockWithDetails.updatedAt = page.updatedAt;
  blockWithDetails.updatedBy = page.updatedBy;
  return blockWithDetails;
}
