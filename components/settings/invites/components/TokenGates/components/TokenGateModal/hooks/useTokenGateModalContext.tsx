import { isTruthy } from '@packages/utils/types';
import type { PopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

import { useCreateTokenGate } from 'charmClient/hooks/tokenGates';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import type { TokenGate } from 'lib/tokenGates/interfaces';

export type DisplayedPage =
  | 'tokens'
  | 'collectables'
  | 'home'
  | 'review'
  | 'wallet'
  | 'communities'
  | 'unlock'
  | 'hypersub'
  | 'credentials';
export type Flow = 'single' | 'multiple_all' | 'multiple_one';

type IContext = {
  flow: Flow;
  tokenGate?: Pick<TokenGate, 'conditions'>;
  displayedPage: DisplayedPage;
  popupState: PopupState;
  setFlow: (flow: Flow) => void;
  onSubmit: () => Promise<void>;
  onDelete: (index: number) => void;
  resetModal: () => void;
  handleTokenGate: (tokenGate: Pick<TokenGate, 'conditions'>) => void;
  setDisplayedPage: (page: DisplayedPage) => void;
  loadingToken: boolean;
  error?: string;
};

export const TokenGateModalContext = createContext<Readonly<IContext>>({
  handleTokenGate: () => undefined,
  onSubmit: async () => undefined,
  onDelete: () => undefined,
  popupState: {} as PopupState,
  flow: 'single',
  setFlow: () => undefined,
  resetModal: () => undefined,
  displayedPage: 'home',
  setDisplayedPage: () => undefined,
  loadingToken: false,
  tokenGate: undefined,
  error: undefined
});

export function TokenGateModalProvider({
  children,
  popupState,
  refreshTokenGates
}: {
  children: ReactNode;
  popupState: PopupState;
  refreshTokenGates: () => void;
}) {
  const [displayedPage, setDisplayedPage] = useState<DisplayedPage>('home');
  const [tokenGate, setTokenGate] = useState<Pick<TokenGate, 'conditions'>>();
  const { error: tokenError, isMutating: tokenLoading, trigger: createTokenGate } = useCreateTokenGate();
  const [flow, setFlow] = useState<Flow>('single');
  const { space } = useCurrentSpace();
  const spaceId = space?.id || '';

  const handleTokenGate = (_tokenGate: Pick<TokenGate, 'conditions'>) => {
    setTokenGate((prevState) => {
      return {
        conditions: {
          accessControlConditions: [
            ...(prevState?.conditions.accessControlConditions || []),
            ..._tokenGate.conditions.accessControlConditions
          ],
          operator: _tokenGate.conditions.operator || prevState?.conditions.operator || 'OR'
        }
      };
    });
  };

  const resetModal = () => {
    setFlow('single');
    setDisplayedPage('home');
    setTokenGate(undefined);
  };

  const onSuccess = () => {
    refreshTokenGates();
    resetModal();
    popupState.close();
  };

  const createAccessControlConditions = async () => {
    const accessControlConditions = tokenGate?.conditions.accessControlConditions || [];
    const operator = tokenGate?.conditions.operator || 'OR';

    const conditions = { accessControlConditions, operator };

    await createTokenGate({
      conditions,
      spaceId
    });

    onSuccess();
  };

  /**
   * Use this function to delete conditions
   */
  const onDelete = (index: number) => {
    setTokenGate((prevState) => {
      const accessControlConditions = prevState?.conditions.accessControlConditions || [];
      const conditionExists = !!accessControlConditions.find((_, i) => i === index);

      if (conditionExists) {
        accessControlConditions.splice(index, 1);

        return {
          conditions: {
            ...prevState,
            accessControlConditions: [...accessControlConditions].filter(isTruthy)
          }
        };
      }
    });
  };

  const value: IContext = useMemo(
    () => ({
      onSubmit: createAccessControlConditions,
      onDelete,
      resetModal,
      setDisplayedPage,
      handleTokenGate,
      setFlow,
      popupState,
      displayedPage,
      tokenGate,
      flow,
      loadingToken: tokenLoading,
      error: tokenError?.message
    }),
    [
      flow,
      displayedPage,
      tokenLoading,
      tokenGate,
      popupState,
      tokenError?.message,
      resetModal,
      onDelete,
      handleTokenGate
    ]
  );

  return <TokenGateModalContext.Provider value={value}>{children}</TokenGateModalContext.Provider>;
}

export const useTokenGateModal = () => useContext(TokenGateModalContext);
