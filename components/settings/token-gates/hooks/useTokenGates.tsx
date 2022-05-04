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
  updateTokenGateRoles(tokenGateId: string, roleIds: string[]): Promise<void>
  deleteRoleFromTokenGate(tokenGateId: string, roleId: string): Promise<void>
}

export const TokenGatesContext = createContext<Readonly<IContext>>({
  setTokenGatesWithRoles: () => null,
  tokenGatesWithRoles: {},
  tokenGateDescriptions: {},
  mutate: () => undefined as any,
  updateTokenGateRoles: () => undefined as any,
  deleteRoleFromTokenGate: () => undefined as any
});

export function TokenGatesProvider ({ spaceId, children }:{spaceId: string, children: ReactNode}) {
  const [tokenGatesWithRoles, setTokenGatesWithRoles] = useState<IContext['tokenGatesWithRoles']>({});
  const { data, mutate } = useSWR(`tokenGates/${spaceId}`, () => charmClient.getTokenGates({ spaceId }));
  const [tokenGateDescriptions, setTokenGateDescriptions] = useState<IContext['tokenGateDescriptions']>({});
  const { account } = useWeb3React();

  useEffect(() => {
    async function main () {
      if (data) {
        setTokenGatesWithRoles(data.reduce((acc, cur) => ({ ...acc, [cur.id]: cur }), {}));
        const results = await Promise.all(data.map(tokenGate => humanizeAccessControlConditions({
          myWalletAddress: account || '',
          accessControlConditions: (tokenGate.conditions as any)?.accessControlConditions || []
        }).then(description => {
          return {
            description,
            tokenGateId: tokenGate.id
          };
        })));
        setTokenGateDescriptions(results.reduce((acc, result) => ({ ...acc, [result.tokenGateId]: result.description }), {}));
      }
    }
    main();
  }, [data]);

  async function updateTokenGateRoles (tokenGateId: string, roleIds: string[]) {
    if (spaceId) {
      const tokenGateToRoles = await charmClient.updateTokenGateRoles(tokenGateId, spaceId, roleIds);
      // TODO: Replace this with network friendly cache update
      setTokenGatesWithRoles(({
        ...tokenGatesWithRoles,
        [tokenGateId]: {
          ...tokenGatesWithRoles[tokenGateId],
          tokenGateToRoles
        }
      }));
    }
  }

  async function deleteRoleFromTokenGate (tokenGateId: string, roleId: string) {
    const tokenGate = tokenGatesWithRoles[tokenGateId];
    if (tokenGate) {
      const roleIds = tokenGate.tokenGateToRoles.map(tokenGateToRole => tokenGateToRole.roleId).filter(tokenGateRoleId => tokenGateRoleId !== roleId);
      const tokenGateToRoles = await charmClient.updateTokenGateRoles(tokenGateId, spaceId, roleIds);
      setTokenGatesWithRoles(({
        ...tokenGatesWithRoles,
        [tokenGateId]: {
          ...tokenGatesWithRoles[tokenGateId],
          tokenGateToRoles
        }
      }));
    }
  }

  const value: IContext = useMemo(() => ({
    tokenGatesWithRoles,
    tokenGateDescriptions,
    setTokenGatesWithRoles,
    mutate,
    updateTokenGateRoles,
    deleteRoleFromTokenGate
  }), [tokenGatesWithRoles, tokenGateDescriptions]);

  return (
    <TokenGatesContext.Provider value={value}>
      {children}
    </TokenGatesContext.Provider>
  );
}

export const useTokenGates = () => useContext(TokenGatesContext);
