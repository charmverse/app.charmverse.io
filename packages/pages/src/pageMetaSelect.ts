import type { PageMeta } from '@packages/core/pages';

export function pageMetaSelect(): Record<keyof PageMeta, true> {
  return {
    id: true,
    boardId: true,
    bountyId: true,
    cardId: true,
    createdAt: true,
    createdBy: true,
    deletedAt: true,
    deletedBy: true,
    galleryImage: true,
    hasContent: true,
    headerImage: true,
    lensPostLink: true,
    icon: true,
    index: true,
    parentId: true,
    path: true,
    syncWithPageId: true,
    proposalId: true,
    title: true,
    spaceId: true,
    updatedAt: true,
    updatedBy: true,
    type: true,
    sourceTemplateId: true
  };
}
