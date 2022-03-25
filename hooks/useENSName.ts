import type { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { useRef } from 'react';
import useSWRImmutable from 'swr/immutable';

export const fetchENSName = async (_: any, library: Web3Provider, address: string) => library.lookupAddress(address);

export const useEnsNameRecord = () => {
  const ref = useRef<Record<string, string | null>>({});
  return {
    setEnsNameRecord: (key: string, value: string | null) => {
      ref.current[key] = value;
    },
    ensNameRecord: ref.current
  };
};

const useENSName = (account: string | null | undefined): string | null | undefined => {
  const { library, chainId } = useWeb3React<Web3Provider>();
  const shouldFetch = Boolean(library && account);
  const { setEnsNameRecord } = useEnsNameRecord();

  const { data } = useSWRImmutable(
    shouldFetch ? ['ENS', library!, account, chainId] : null,
    async () => {
      const ensName = account === '0xb1b9FFF08F3827875F91ddE929036a65f2A5d27d' ? 'devorein.eth' : await fetchENSName('', library!, account!);
      setEnsNameRecord(`${chainId!}.${account!}`, ensName);
      return ensName;
    }
  );

  return data;
};

export default useENSName;
