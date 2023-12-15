import type {
  AuthSig,
  JsonSigningResourceId,
  JsonStoreSigningRequest,
  UnifiedAccessControlConditions
} from '@lit-protocol/types';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';
import { v4 as uuid } from 'uuid';

import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import { useSaveSigningCondition, useCreateTokenGate } from 'charmClient/hooks/tokenGates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { Lock, TokenGate } from 'lib/tokenGates/interfaces';
import { isTruthy } from 'lib/utilities/types';

import { createAuthSigs, getAllChains } from '../utils/helpers';

export type DisplayedPage = 'tokens' | 'collectables' | 'home' | 'review' | 'wallet' | 'dao' | 'unlock';
export type Flow = 'single' | 'multiple_all' | 'multiple_one';

export type ConditionsModalResult = Pick<JsonStoreSigningRequest, 'unifiedAccessControlConditions'> & {
  authSigTypes: string[];
  chains: string[];
  permanent: true;
};

type IContext = {
  handleUnifiedAccessControlConditions: (conditions: UnifiedAccessControlConditions) => void;
  onSubmit: (type: TokenGate['type']) => Promise<void>;
  unifiedAccessControlConditions: UnifiedAccessControlConditions;
  flow: Flow;
  lock?: Lock;
  setFlow: (flow: Flow) => void;
  resetModal: () => void;
  handleLock: (lock: Lock) => void;
  displayedPage: DisplayedPage;
  setDisplayedPage: (page: DisplayedPage) => void;
  onClose: () => void;
  loadingToken: boolean;
  error?: string;
};

export const TokenGateModalContext = createContext<Readonly<IContext>>({
  handleUnifiedAccessControlConditions: () => undefined,
  onSubmit: async () => undefined,
  unifiedAccessControlConditions: [],
  flow: 'single',
  setFlow: () => undefined,
  resetModal: () => undefined,
  displayedPage: 'home',
  setDisplayedPage: () => undefined,
  onClose: () => undefined,
  handleLock: () => undefined,
  loadingToken: false,
  lock: undefined,
  error: undefined
});

export function TokenGateModalProvider({
  children,
  onClose,
  refreshTokenGates
}: {
  children: ReactNode;
  onClose: () => void;
  refreshTokenGates: () => void;
}) {
  const [displayedPage, setDisplayedPage] = useState<DisplayedPage>('home');
  const [unifiedAccessControlConditions, setUnifiedAccessControlConditions] = useState<UnifiedAccessControlConditions>(
    []
  );
  const [lock, setLock] = useState<Lock>();
  const litClient = useLitProtocol();
  const { error: tokenError, isMutating: tokenLoading, trigger: createTokenGate } = useCreateTokenGate();
  const { error: litError, isMutating: litLoading, trigger: saveSigningCondition } = useSaveSigningCondition(litClient);
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

  const handleLock = (_lock: Lock) => {
    setLock(_lock);
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

    if (!authSig || !authSigTypes[0]) {
      return;
    }

    const litSuccess = await saveSigningCondition({
      unifiedAccessControlConditions: conditions.unifiedAccessControlConditions,
      chain: authSigTypes[0], // etherum or solana
      authSig,
      resourceId
    });

    if (litSuccess) {
      await createTokenGate({
        conditions,
        resourceId,
        spaceId,
        type: 'lit',
        id: tokenGateId
      });

      refreshTokenGates();
    }

    resetModal();
    onClose();
  };

  const createUnlockProtocolGate = async () => {
    if (lock) {
      const id = uuid();

      await createTokenGate({
        conditions: {
          contract: lock.contract,
          chainId: lock.chainId,
          name: lock.name || ''
        },
        type: 'unlock',
        resourceId: {},
        spaceId,
        id
      });

      refreshTokenGates();
      resetModal();
      onClose();
    }
  };

  const onSubmit = async (type: TokenGate['type']) => {
    if (type === 'unlock') {
      await createUnlockProtocolGate();
    } else if (type === 'lit') {
      await createUnifiedAccessControlConditions();
    }
  };

  const value = useMemo(
    () => ({
      handleUnifiedAccessControlConditions,
      onSubmit,
      resetModal,
      setDisplayedPage,
      setFlow,
      onClose,
      handleLock,
      unifiedAccessControlConditions,
      displayedPage,
      lock,
      flow,
      loadingToken: tokenLoading || litLoading,
      error: tokenError?.message || typeof litError?.message === 'string' ? litError?.message : undefined
    }),
    [
      flow,
      lock,
      unifiedAccessControlConditions,
      displayedPage,
      tokenLoading,
      litLoading,
      tokenError?.message,
      litError?.message,
      resetModal,
      onClose,
      handleLock,
      handleUnifiedAccessControlConditions
    ]
  );

  return <TokenGateModalContext.Provider value={value}>{children}</TokenGateModalContext.Provider>;
}

export const useTokenGateModal = () => useContext(TokenGateModalContext);
