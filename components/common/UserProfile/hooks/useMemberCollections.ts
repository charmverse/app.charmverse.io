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
    nfts,
    mutateNfts,
    isFetchingNfts,
    nftsError
  };
}
