import type { PageMeta } from '@packages/core/pages';

import type { TrashOrDeletePageResponse } from 'lib/pages';
import type { PageViewMeta } from 'lib/pages/getRecentHistory';
import type { PageWithContent, PageMetaLite } from 'lib/pages/interfaces';

import { useGET, useGETImmutable, useGETtrigger, usePUT } from './helpers';

export function useTrashPages() {
  return usePUT<{ pageIds: string[]; trash: boolean }, TrashOrDeletePageResponse>('/api/pages/trash');
}

export function useGetPage(pageId?: string | null) {
  return useGET<PageWithContent>(pageId ? `/api/pages/${pageId}` : null);
}

export function useGetPageMarkdown(pageId?: string | null) {
  return useGETtrigger<undefined, string>(pageId ? `/api/pages/${pageId}/export-markdown` : null);
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

export function useGetRecentHistory({ spaceId, limit }: { spaceId?: string; limit?: number }) {
  return useGET<PageViewMeta[]>(
    spaceId ? `/api/pages/recent-history` : null,
    { spaceId, limit },
    { revalidateOnFocus: false, revalidateOnReconnect: false }
  );
}
