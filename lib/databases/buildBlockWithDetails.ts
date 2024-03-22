import type { Block, Page } from '@charmverse/core/prisma';

import { replaceS3Domain } from 'lib/utils/url';

import type { BlockWithDetails } from './block';

// mutative method, for performance reasons
export function buildBlockWithDetails(
  block: Block,
  page: Pick<
    Page,
    | 'title'
    | 'headerImage'
    | 'galleryImage'
    | 'hasContent'
    | 'updatedBy'
    | 'updatedAt'
    | 'type'
    | 'id'
    | 'bountyId'
    | 'icon'
  >
): BlockWithDetails {
  const blockWithDetails = block as BlockWithDetails;
  blockWithDetails.bountyId = page.bountyId || undefined;
  blockWithDetails.pageId = page.id;
  blockWithDetails.icon = page.icon || undefined;
  blockWithDetails.galleryImage = replaceS3Domain(page.headerImage || page.galleryImage || undefined);
  blockWithDetails.hasContent = page.hasContent;
  blockWithDetails.title = page.title || block.title;
  blockWithDetails.pageType = page.type;
  blockWithDetails.updatedAt = page.updatedAt;
  blockWithDetails.updatedBy = page.updatedBy;
  return blockWithDetails;
}
