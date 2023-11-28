import type {
  AuthSig,
  JsonSigningResourceId,
  JsonStoreSigningRequest,
  UnifiedAccessControlConditions
} from '@lit-protocol/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { mutate } from 'swr';
import { v4 as uuid } from 'uuid';

import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import { useCreateLitToken, useCreateTokenGate } from 'charmClient/hooks/tokenGates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWeb3Account } from 'hooks/useWeb3Account';
import { isTruthy } from 'lib/utilities/types';

import { createAuthSigs, getAllChains } from '../utils/helpers';

export type DisplayedPage = 'tokens' | 'collectables' | 'advanced' | 'home' | 'review' | 'wallet' | 'dao';
export type Flow = 'single' | 'multiple_all' | 'multiple_one';

export type ConditionsModalResult = Pick<JsonStoreSigningRequest, 'unifiedAccessControlConditions'> & {
  authSigTypes: string[];
  chains: string[];
  permanent: true;
};

type IContext = {
  handleUnifiedAccessControlConditions: (conditions: UnifiedAccessControlConditions) => void;
  createUnifiedAccessControlConditions: () => Promise<void>;
  unifiedAccessControlConditions: UnifiedAccessControlConditions;
  flow: Flow;
  setFlow: (flow: Flow) => void;
  resetModal: () => void;
  displayedPage: DisplayedPage;
  setDisplayedPage: (page: DisplayedPage) => void;
  onClose: () => void;
  loadingToken: boolean;
  error?: string;
};

export const TokenGateModalContext = createContext<Readonly<IContext>>({
  handleUnifiedAccessControlConditions: () => undefined,
  createUnifiedAccessControlConditions: async () => undefined,
  unifiedAccessControlConditions: [],
  flow: 'single',
  setFlow: () => undefined,
  resetModal: () => undefined,
  displayedPage: 'home',
  setDisplayedPage: () => undefined,
  onClose: () => undefined,
  loadingToken: false,
  error: undefined
});

export function TokenGateModalProvider({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  const [displayedPage, setDisplayedPage] = useState<DisplayedPage>('home');
  const [unifiedAccessControlConditions, setUnifiedAccessControlConditions] = useState<UnifiedAccessControlConditions>(
    []
  );
  const litClient = useLitProtocol();
  const { error: tokenError, isMutating: tokenLoading, trigger: triggerToken } = useCreateTokenGate();
  const { error: litError, isMutating: litLoading, trigger: triggerLitToken } = useCreateLitToken(litClient);
  const [flow, setFlow] = useState<Flow>('single');
  const { walletAuthSignature, requestSignature } = useWeb3Account();
  const { space } = useCurrentSpace();
  const spaceId = space?.id || '';

  const handleUnifiedAccessControlConditions = (conditions: UnifiedAccessControlConditions) => {
    const andOperator = { operator: 'and' };
    const orOperator = { operator: 'or' };
    const operator = flow === 'multiple_all' ? andOperator : flow === 'multiple_one' ? orOperator : undefined;
    setUnifiedAccessControlConditions((prevState) => [...prevState, operator, ...conditions].filter(isTruthy));
  };

  const clearAllAccessControlConditions = () => {
    setUnifiedAccessControlConditions([]);
  };

  const resetModal = () => {
    setFlow('single');
    setDisplayedPage('home');
    clearAllAccessControlConditions();
  };

  const createUnifiedAccessControlConditions = async () => {
    const authSigTypes = createAuthSigs(unifiedAccessControlConditions);
    const chains = getAllChains(unifiedAccessControlConditions);

    const conditions: ConditionsModalResult = {
      unifiedAccessControlConditions,
      permanent: true,
      chains,
      authSigTypes
    };

    const tokenGateId = uuid();
    const resourceId: JsonSigningResourceId = {
      baseUrl: 'https://app.charmverse.io',
      path: `${Math.random()}`,
      orgId: spaceId,
      role: 'member',
      extraData: JSON.stringify({
        tokenGateId
      })
    };

    const authSig: AuthSig = walletAuthSignature ?? (await requestSignature());

    const litSuccess = await triggerLitToken({
      unifiedAccessControlConditions: conditions.unifiedAccessControlConditions,
      chain: authSigTypes[0], // etherum or solana
      authSig,
      resourceId
    });

    if (litSuccess) {
      await triggerToken({
        conditions,
        resourceId,
        spaceId,
        id: tokenGateId
      });

      mutate(`tokenGates/${spaceId}`);
    }

    resetModal();
  };

  const value = useMemo(
    () => ({
      handleUnifiedAccessControlConditions,
      createUnifiedAccessControlConditions,
      resetModal,
      setDisplayedPage,
      setFlow,
      onClose,
      unifiedAccessControlConditions,
      displayedPage,
      flow,
      loadingToken: tokenLoading || litLoading,
      error: tokenError?.message || typeof litError?.message === 'string' ? litError?.message : undefined
    }),
    [
      flow,
      unifiedAccessControlConditions,
      displayedPage,
      tokenLoading,
      litLoading,
      tokenError?.message,
      litError?.message,
      resetModal,
      onClose,
      handleUnifiedAccessControlConditions
    ]
  );

  return <TokenGateModalContext.Provider value={value}>{children}</TokenGateModalContext.Provider>;
}

export const useTokenGateModal = () => useContext(TokenGateModalContext);
