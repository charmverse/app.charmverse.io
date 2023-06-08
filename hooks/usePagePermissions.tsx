import useSWR from 'swr';
import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';

type Props = {
  // Provide value of null to skip fetching
  pageIdOrPath?: string | null;
  spaceDomain?: string;
  revalidate?: boolean;
};

export function usePagePermissions({ pageIdOrPath, spaceDomain, revalidate = true }: Props) {
  const { data } = (revalidate ? useSWR : useSWRImmutable)(
    !pageIdOrPath ? null : `compute-page-permissions-${pageIdOrPath}${spaceDomain ?? ''}-${revalidate}`,
    () =>
      charmClient.permissions.pages.computePagePermissions({
        pageIdOrPath: pageIdOrPath as string,
        spaceDomain
      })
  );

  return { permissions: data };
}
