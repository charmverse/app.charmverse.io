import useSWRImmutable from 'swr/immutable';

import charmClient from 'charmClient';

export function useMemberCollections({ memberId }: { memberId: string }) {
  const {
    data: poaps = [],
    isLoading: isFetchingPoaps,
    error: poapsError
  } = useSWRImmutable(`/poaps/${memberId}`, () => {
    return charmClient.getUserPoaps(memberId);
  });

  const {
    data: orgs = [],
    mutate: mutateOrgs,
    isLoading: isFetchingOrgs,
    error: orgsError
  } = useSWRImmutable(`/orgs/${memberId}`, () => {
    return charmClient.profile.getOrgs(memberId);
  });

  const {
    data: nfts = [],
    mutate: mutateNfts,
    isLoading: isFetchingNfts,
    error: nftsError
  } = useSWRImmutable(`/nfts/${memberId}`, () => {
    return charmClient.blockchain.listNFTs(memberId);
  });

  return {
    poaps,
    isFetchingPoaps,
    poapsError,
    orgs,
    mutateOrgs,
    isFetchingOrgs,
    orgsError,
    nfts,
    mutateNfts,
    isFetchingNfts,
    nftsError
  };
}
