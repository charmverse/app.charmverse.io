import type { Web3Provider } from '@ethersproject/providers';
import useSWRImmutable from 'swr/immutable';

import { useWeb3AuthSig } from 'hooks/useWeb3AuthSig';

const fetchENSName = (_: any, library: Web3Provider, address: string) => library.lookupAddress(address);

const useENSName = (account: string | null | undefined): string | null | undefined => {
  const { library, chainId } = useWeb3AuthSig();
  const shouldFetch = Boolean(library && account);

  const { data } = useSWRImmutable(shouldFetch ? ['ENS', library, account, chainId] : null, fetchENSName);

  return data;
};

export default useENSName;
