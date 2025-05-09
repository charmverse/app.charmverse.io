import Box from '@mui/material/Box';

import Modal from 'components/common/Modal';

import { TokenGateContent } from './components/TokenGateContent';
import { useTokenGateModal } from './hooks/useTokenGateModalContext';
import { getTitle } from './utils/helpers';

function TokenGateModal() {
  const { displayedPage, popupState, resetModal } = useTokenGateModal();

  const handleClose = () => {
    popupState.close();
    resetModal();
  };

  return (
    <Modal open={popupState.isOpen} onClose={handleClose} size='large' title={getTitle(displayedPage)}>
      <Box display='flex' gap={2} flexDirection='column'>
        <TokenGateContent />
      </Box>
    </Modal>
  );
}

export default TokenGateModal;
