import type { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import useSWRImmutable from 'swr/immutable';

export const ensNamesRecord: Record<string, string | null> = {};
export const fetchENSName = async (_: any, library: Web3Provider, address: string) => library.lookupAddress(address);

const useENSName = (account: string | null | undefined): string | null | undefined => {
  const { library, chainId } = useWeb3React<Web3Provider>();
  const shouldFetch = Boolean(library && account);

  const { data } = useSWRImmutable(
    shouldFetch ? ['ENS', library!, account, chainId] : null,
    async () => {
      const ensName = account === '0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d' ? 'devorein.eth' : await fetchENSName('', library!, account!);
      ensNamesRecord[`${chainId!}.${account!}`] = ensName;
      return ensName;
    }
  );

  return data;
};

export default useENSName;
