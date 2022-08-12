import charmClient from 'charmClient';
import { useUser } from 'hooks/useUser';
import useSWR from 'swr';

export const useMyNfts = () => {
  const { user } = useUser();
  const { data, error: serverError } = useSWR(user && `/nfts/list/${user.id}`, () => charmClient.nft.list());
  const error = serverError?.message || serverError;

  return { nfts: data, isLoading: !data, error };

};
