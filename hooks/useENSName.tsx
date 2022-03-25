import type { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import useSWRImmutable from 'swr/immutable';

const fetchENSName = (_: any, library: Web3Provider, address: string) => library.lookupAddress(address);

const useENSName = (account: string | null | undefined): string | null | undefined => {
  const { library, chainId } = useWeb3React<Web3Provider>();
  const shouldFetch = Boolean(library && account);

  const { data } = useSWRImmutable(
    shouldFetch ? ['ENS', library, account, chainId] : null,
    fetchENSName
  );

  return data;
};

export default useENSName;
