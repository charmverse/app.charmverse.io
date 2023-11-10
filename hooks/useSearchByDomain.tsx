import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';

export function useSearchByDomain(domain: string) {
  const {
    data: spaceFromPath,
    isLoading: isSpaceLoading,
    error: spaceError
  } = useSWRImmutable(domain ? `space/${domain}` : null, () =>
    charmClient.spaces.searchByDomain(stripUrlParts(domain || ''))
  );

  return { spaceFromPath, isSpaceLoading, spaceError };
}

function stripUrlParts(maybeUrl: string) {
  return maybeUrl.replace('https://app.charmverse.io/', '').replace('http://localhost:3000/', '').split('/')[0];
}
