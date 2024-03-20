import useSWR from 'swr';

import charmClient from 'charmClient';
import type { MaybeString } from 'charmClient/hooks/helpers';

export function useGetIssuableProposalCredentials({ spaceId }: { spaceId: MaybeString }) {
  const {
    data: issuableProposalCredentials,
    error,
    isLoading,
    mutate
  } = useSWR(spaceId ? `/api/credentials/proposals?spaceId=${spaceId}` : null, () =>
    charmClient.credentials.getIssuableProposalCredentials({ spaceId: spaceId as string })
  );
  return {
    issuableProposalCredentials,
    isLoading,
    error,
    refreshIssuableCredentials: mutate
  };
}
