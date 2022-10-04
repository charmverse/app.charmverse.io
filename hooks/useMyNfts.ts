import useSWR from 'swr';

import charmClient from 'charmClient';

export const useMyNfts = (userId: string) => {
  const { data, error: serverError } = useSWR(userId && `/nfts/list/${userId}`, () => charmClient.blockchain.listNFTs(userId));
  const error = serverError?.message || serverError;

  return { nfts: data, isLoading: !data, error };
};
