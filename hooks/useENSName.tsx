import type { Web3Provider } from '@ethersproject/providers';
import { useWeb3React } from '@web3-react/core';
import { createContext, ReactNode, useContext, useMemo, useRef } from 'react';
import useSWRImmutable from 'swr/immutable';

export const fetchENSName = async (_: any, library: Web3Provider, address: string) => library.lookupAddress(address);

type IContext = {
  setEnsNameRecord: (key: string, value: string | null) => void
  ensNameRecord: Record<string, string | null>
}

export const EnsNamesRecordContext = createContext<IContext>({
  setEnsNameRecord: () => null,
  ensNameRecord: {}
});

export function EnsNamesRecordProvider ({ children }: {children: ReactNode}) {
  const ref = useRef<Record<string, string | null>>({});

  const value: IContext = useMemo(() => ({
    setEnsNameRecord: (key: string, _value: string | null) => {
      ref.current[key] = _value;
    },
    ensNameRecord: ref.current
  }), [ref]);

  return (
    <EnsNamesRecordContext.Provider value={value}>
      {children}
    </EnsNamesRecordContext.Provider>
  );
}

export const useEnsNameRecord = () => useContext(EnsNamesRecordContext);

const useENSName = (account: string | null | undefined): string | null | undefined => {
  const { library, chainId } = useWeb3React<Web3Provider>();
  const shouldFetch = Boolean(library && account);
  const { setEnsNameRecord } = useEnsNameRecord();

  const { data } = useSWRImmutable(
    shouldFetch ? ['ENS', library!, account, chainId] : null,
    async () => {
      const ensName = await fetchENSName('', library!, account!);
      setEnsNameRecord(`${chainId!}.${account!}`, ensName);
      return ensName;
    }
  );

  return data;
};

export default useENSName;
