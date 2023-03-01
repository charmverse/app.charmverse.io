import useSWR from 'swr';

import charmClient from 'charmClient';
import { AllowedPagePermissions } from 'lib/permissions/pages/available-page-permissions.class';

type Props = {
  // Provide value of null to skip fetching
  pageIdOrPath: string | null;
  spaceDomain?: string;
  isNewPage?: boolean;
};

export function usePagePermissions({ pageIdOrPath, spaceDomain, isNewPage }: Props) {
  const { data, mutate } = useSWR(
    !pageIdOrPath ? null : `compute-page-permissions-${pageIdOrPath}${spaceDomain ?? ''}`,
    () =>
      charmClient.permissions.pages.computePagePermissions({
        pageIdOrPath: pageIdOrPath as string,
        spaceDomain
      })
  );

  return { permissions: isNewPage ? new AllowedPagePermissions().full : data, refresh: mutate };
}
