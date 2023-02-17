import useSWR from 'swr';

import charmClient from 'charmClient';
import { AllowedPagePermissions } from 'lib/permissions/pages';

type Props = {
  pageIdOrPath: string;
  spaceDomain?: string;
  isNewPage?: boolean;
};

export function useProposalPermissions({ pageIdOrPath, spaceDomain, isNewPage }: Props) {
  const { data } = useSWR(!pageIdOrPath ? null : `compute-page-permissions-${pageIdOrPath}${spaceDomain ?? ''}`, () =>
    charmClient.permissions.pages.computePagePermissions({
      pageIdOrPath,
      spaceDomain
    })
  );

  if (isNewPage) {
    return new AllowedPagePermissions().full;
  }

  return data;
}
