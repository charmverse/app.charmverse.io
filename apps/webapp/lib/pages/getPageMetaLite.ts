import type { Page } from '@charmverse/core/prisma';

import type { PageMetaLite } from './interfaces';

type RequiredFields = Pick<Page, 'id' | 'type'>;
type OptionalFields = Pick<Page, 'title' | 'hasContent' | 'icon' | 'parentId' | 'path'>;
type PageFields = RequiredFields & Partial<OptionalFields>;

export function getPageMetaLite(page: PageFields): PageMetaLite {
  return {
    id: page.id,
    title: page.title || '',
    parentId: page.parentId || undefined,
    hasContent: page.hasContent,
    type: page.type,
    icon: page.icon,
    path: page.path ?? page.id
  };
}
