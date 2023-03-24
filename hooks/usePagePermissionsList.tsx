import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';

export function usePagePermissionsList({ pageId }: { pageId: string | null }) {
  const { data: pagePermissions, mutate: refreshPermissions } = useSWRImmutable(
    pageId ? `/api/pages/${pageId}/permissions` : null,
    () => charmClient.listPagePermissions(pageId as string)
  );

  return { pagePermissions, refreshPermissions };
}
