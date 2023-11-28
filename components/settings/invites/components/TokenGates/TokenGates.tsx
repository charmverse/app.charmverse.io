import { log } from '@charmverse/core/log';
import type { Space } from '@charmverse/core/prisma';
import type { JsonSigningResourceId } from '@lit-protocol/types';
import { debounce } from 'lodash';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useMemo, useState } from 'react';
import useSWR from 'swr';
import { v4 as uuid } from 'uuid';

import useLitProtocol from 'adapters/litProtocol/hooks/useLitProtocol';
import charmClient from 'charmClient';
import { LitShareModal } from 'components/common/LitProtocolModal';
import type { ConditionsModalResult } from 'components/common/LitProtocolModal/shareModal/ShareModal';
import Modal, { ErrorModal } from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { TokenGateModalProvider } from 'components/common/TokenGateModal/hooks/useTokenGateModalContext';
import TokenGateModal from 'components/common/TokenGateModal/TokenGateModal';
import { isProdEnv } from 'config/constants';
import { useWeb3Account } from 'hooks/useWeb3Account';
import type { AuthSig } from 'lib/blockchain/interfaces';

import TokenGatesTable from './components/TokenGatesTable';

interface TokenGatesProps {
  popupState: PopupState;
  isAdmin: boolean;
  space: Space;
}

export function TokenGates({ isAdmin, space, popupState }: TokenGatesProps) {
  const deletePopupState = usePopupState({ variant: 'popover', popupId: 'token-gate-delete' });
  const [removedTokenGateId, setRemovedTokenGate] = useState<string | null>(null);
  const spaceId = space.id;
  const litClient = useLitProtocol();
  const { walletAuthSignature, requestSignature, chainId } = useWeb3Account();
  const errorPopupState = usePopupState({ variant: 'popover', popupId: 'token-gate-error' });
  const [apiError, setApiError] = useState<string>('');
  const { data = [], mutate } = useSWR(`tokenGates/${spaceId}`, () =>
    charmClient.tokenGates.getTokenGates({ spaceId })
  );

  const { isOpen: isOpenTokenGateModal, close: closeTokenGateModal } = popupState;

  function onSubmit(conditions: ConditionsModalResult) {
    setApiError('');
    return saveTokenGate(conditions)
      .then(() => {
        closeTokenGateModal();
      })
      .catch((error) => {
        log.warn('Error saving token gate', { error });
        setApiError(error.message || error);
        errorPopupState.open();
      });
  }

  const throttledOnSubmit = useMemo(() => debounce(onSubmit, 200), [litClient, walletAuthSignature]);

  function closeTokenGateDeleteModal() {
    setRemovedTokenGate(null);
    deletePopupState.close();
  }

  async function saveTokenGate(conditions: ConditionsModalResult) {
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

    await litClient?.saveSigningCondition({
      unifiedAccessControlConditions: conditions.unifiedAccessControlConditions,
      // not that we can use 'ethereum' for all EVM chains. this would need to be updated to support Solana
      chain: 'ethereum',
      authSig,
      resourceId
    });
    await charmClient.tokenGates.saveTokenGate({
      conditions: conditions as any,
      resourceId,
      spaceId,
      id: tokenGateId
    });
    await mutate();
  }

  async function deleteTokenGate(tokenGate: { id: string }) {
    setRemovedTokenGate(tokenGate.id);
    deletePopupState.open();
  }

  return (
    <>
      <TokenGatesTable
        isAdmin={isAdmin}
        tokenGates={data}
        onDelete={deleteTokenGate}
        refreshTokenGates={async () => {
          mutate();
        }}
      />
      <Modal open={isOpenTokenGateModal} onClose={closeTokenGateModal} size='large'>
        <TokenGateModalProvider onClose={closeTokenGateModal}>
          <TokenGateModal />
        </TokenGateModalProvider>
      </Modal>
      <ErrorModal message={apiError} open={errorPopupState.isOpen} onClose={errorPopupState.close} />
      {removedTokenGateId && (
        <ConfirmDeleteModal
          title='Delete token gate'
          onClose={closeTokenGateDeleteModal}
          open={deletePopupState.isOpen}
          buttonText='Delete token gate'
          question='Are you sure you want to delete this invite link?'
          onConfirm={async () => {
            await charmClient.tokenGates.deleteTokenGate(removedTokenGateId);
            // update the list of links
            await mutate();
            setRemovedTokenGate(null);
          }}
        />
      )}
    </>
  );
}
