import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import useSWR from 'swr';

export const useMyNfts = (userId?: string) => {
  const { user } = useUser();
  userId = user?.id || userId;
  const { data, error: serverError } = useSWR(userId && `/nfts/list/${userId}`, () => charmClient.nft.list(userId!));
  const error = serverError?.message || serverError;

  return { nfts: data, isLoading: !data, error };

};
