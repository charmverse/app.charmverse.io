import Box from '@mui/material/Box';

import { DialogTitle } from '../Modal';

import { SingleConditionSelect } from './components/SingleConditionSelect';
import { useTokenGateModal } from './hooks/useTokenGateModalContext';
import { getTitle } from './utils/helpers';

function TokenGateModal() {
  const { displayedPage } = useTokenGateModal();

  return (
    <Box display='flex' gap={2} flexDirection='column'>
      <DialogTitle>{getTitle(displayedPage)}</DialogTitle>
      <SingleConditionSelect />
    </Box>
  );
}

export default TokenGateModal;
