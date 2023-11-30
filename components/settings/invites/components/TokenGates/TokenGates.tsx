import type { Space } from '@charmverse/core/prisma';
import type { PopupState } from 'material-ui-popup-state/hooks';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useState } from 'react';
import useSWR from 'swr';

import charmClient from 'charmClient';
import Modal from 'components/common/Modal';
import ConfirmDeleteModal from 'components/common/Modal/ConfirmDeleteModal';
import { TokenGateModalProvider } from 'components/common/TokenGateModal/hooks/useTokenGateModalContext';
import TokenGateModal from 'components/common/TokenGateModal/TokenGateModal';

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
  const { data = [], mutate } = useSWR(`tokenGates/${spaceId}`, () =>
    charmClient.tokenGates.getTokenGates({ spaceId })
  );

  const { isOpen: isOpenTokenGateModal, close: closeTokenGateModal } = popupState;

  function closeTokenGateDeleteModal() {
    setRemovedTokenGate(null);
    deletePopupState.close();
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
