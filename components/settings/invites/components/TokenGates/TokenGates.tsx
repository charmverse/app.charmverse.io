import type { Space } from '@charmverse/core/prisma';
import type { PopupState } from 'material-ui-popup-state/hooks';

import { useGetTokenGates } from 'charmClient/hooks/tokenGates';
import Modal from 'components/common/Modal';
import { TokenGateModalProvider } from 'components/common/TokenGateModal/hooks/useTokenGateModalContext';
import TokenGateModal from 'components/common/TokenGateModal/TokenGateModal';

import TokenGatesTable from './components/TokenGatesTable';

interface TokenGatesProps {
  popupState: PopupState;
  isAdmin: boolean;
  space: Space;
}

export function TokenGates({ isAdmin, space, popupState }: TokenGatesProps) {
  const spaceId = space.id;
  const { data = [], mutate } = useGetTokenGates(spaceId);
  const { isOpen: isOpenTokenGateModal, close: closeTokenGateModal } = popupState;

  return (
    <>
      <TokenGatesTable
        isAdmin={isAdmin}
        tokenGates={data}
        refreshTokenGates={async () => {
          mutate();
        }}
      />
      <Modal open={isOpenTokenGateModal} onClose={closeTokenGateModal} size='large'>
        <TokenGateModalProvider onClose={closeTokenGateModal}>
          <TokenGateModal />
        </TokenGateModalProvider>
      </Modal>
    </>
  );
}
