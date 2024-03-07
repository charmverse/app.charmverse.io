import type { PageMeta } from '@charmverse/core/pages';

import type { ModifyChildPagesResponse } from 'lib/pages';
import type { PageWithContent, PageMetaLite } from 'lib/pages/interfaces';

import { useGET, useGETImmutable, usePUT } from './helpers';

export function useTrashPages() {
  return usePUT<{ pageIds: string[]; trash: boolean }, ModifyChildPagesResponse>('/api/pages/trash');
}

export function useGetPage(pageId?: string | null) {
  return useGET<PageWithContent>(pageId ? `/api/pages/${pageId}` : null);
}

export function useGetPageMeta(pageId?: string | null) {
  return useGET<PageMetaLite>(pageId ? `/api/pages/${pageId}` : null, { meta: true });
}

export function useInitialPagesForSpace(spaceId?: string) {
  return useGETImmutable<PageMeta[]>(spaceId ? `/api/spaces/${spaceId}/pages` : null, { filter: 'not_card' });
}
