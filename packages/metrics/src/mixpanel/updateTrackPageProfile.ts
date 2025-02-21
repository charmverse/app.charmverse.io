import { log } from '@charmverse/core/log';
import type { Page } from '@charmverse/core/prisma';
import { getPage } from '@root/lib/pages/server';

import { mixpanel, GroupKeys } from './mixpanel';

type PageFields = Pick<Page, 'createdAt' | 'title' | 'type' | 'deletedAt' | 'spaceId' | 'createdBy' | 'updatedAt'> & {
  permissions: { public: boolean | null }[];
};

export async function updateTrackPageProfile(pageId: string) {
  try {
    const page = await getPage(pageId);

    if (page) {
      mixpanel?.groups.set(GroupKeys.PageId, page.id, getTrackPageProfile(page));
    }
  } catch (e) {
    log.warn(`Failed to update mixpanel profile for group id ${pageId}`);
  }
}

export function getTrackPageProfile(page: PageFields) {
  const isPublic = page.permissions.some((p) => p.public);

  return {
    $created: page.createdAt,
    $name: page.title,
    Title: page.title,
    Type: page.type,
    Deleted: !!page.deletedAt,
    Public: isPublic,
    'Space Id': page.spaceId,
    'Is Database': ['board', 'inline_board', 'inline_linked_board', 'linked_board'].includes(page.type),
    'Page Created By': page.createdBy,
    'Page Updated At': page.updatedAt
  };
}
