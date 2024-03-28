import type { PageMeta } from '@charmverse/core/pages';

import type { TrashOrDeletePageResponse } from 'lib/pages';
import type { PageWithContent, PageMetaLite } from 'lib/pages/interfaces';

import { useGET, useGETImmutable, usePUT } from './helpers';

export function useTrashPages() {
  return usePUT<{ pageIds: string[]; trash: boolean }, TrashOrDeletePageResponse>('/api/pages/trash');
}

export function useGetPage(pageId?: string | null) {
  return useGET<PageWithContent>(pageId ? `/api/pages/${pageId}` : null);
}

export function useGetPageMeta(pageId?: string | null) {
  return useGET<PageMetaLite>(pageId ? `/api/pages/${pageId}` : null, { meta: true });
}

export function useGetSearchPages({
  spaceId,
  search,
  limit = 50
}: {
  spaceId?: string;
  search: string;
  limit?: number;
}) {
  return useGETImmutable<PageMeta[]>(spaceId && search ? `/api/spaces/${spaceId}/pages` : null, { search, limit });
}
