import { useWeb3React } from '@web3-react/core';
import charmClient from 'charmClient';
import { TokenGateWithRoles } from 'pages/api/token-gates';
import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import useSWR, { KeyedMutator } from 'swr';
import { humanizeAccessControlConditions } from 'lit-js-sdk';

interface IContext {
  tokenGatesWithRoles: Record<string, TokenGateWithRoles>
  setTokenGatesWithRoles: React.Dispatch<React.SetStateAction<IContext['tokenGatesWithRoles']>>
  tokenGateDescriptions: Record<string, string>
  mutate: KeyedMutator<TokenGateWithRoles[]>
}

export const TokenGatesContext = createContext<Readonly<IContext>>({
  setTokenGatesWithRoles: () => null,
  tokenGatesWithRoles: {},
  tokenGateDescriptions: {},
  mutate: () => undefined as any
});

export function TokenGatesProvider ({ spaceId, children }:{spaceId: string, children: ReactNode}) {
  const [tokenGatesWithRoles, setTokenGatesWithRoles] = useState<IContext['tokenGatesWithRoles']>({});
  const { data, mutate } = useSWR(`tokenGates/${spaceId}`, () => charmClient.getTokenGates({ spaceId }));
  const [descriptions, setDescriptions] = useState<IContext['tokenGateDescriptions']>({});
  const { account } = useWeb3React();

  useEffect(() => {
    if (data) {
      setTokenGatesWithRoles(data.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}));
    }
  }, [data]);

  useEffect(() => {
    if (data) {
      Promise.all(data.map(tokenGate => humanizeAccessControlConditions({
        myWalletAddress: account || '',
        accessControlConditions: (tokenGate.conditions as any)?.accessControlConditions || []
      }).then(description => {
        return {
          description,
          tokenGateId: tokenGate.id
        };
      }))).then(results => {
        setDescriptions(results.reduce((acc, result) => ({ ...acc, [result.tokenGateId]: result.description })));
      });
    }
  }, [data]);

  const value: IContext = useMemo(() => ({
    tokenGatesWithRoles,
    tokenGateDescriptions: descriptions,
    setTokenGatesWithRoles,
    mutate
  }), [tokenGatesWithRoles]);

  return (
    <TokenGatesContext.Provider value={value}>
      {children}
    </TokenGatesContext.Provider>
  );
}

export const useTokenGates = () => useContext(TokenGatesContext);
