import useSWR from 'swr';

import charmClient from 'charmClient';

type Props = {
  // Provide value of null to skip fetching
  pageIdOrPath: string | null;
  spaceDomain?: string;
};

export function usePagePermissions({ pageIdOrPath, spaceDomain }: Props) {
  const { data } = useSWR(!pageIdOrPath ? null : `compute-page-permissions-${pageIdOrPath}${spaceDomain ?? ''}`, () =>
    charmClient.permissions.pages.computePagePermissions({
      pageIdOrPath: pageIdOrPath as string,
      spaceDomain
    })
  );

  return { permissions: data };
}
