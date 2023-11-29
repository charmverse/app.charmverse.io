import Box from '@mui/material/Box';

import Legend from 'components/settings/Legend';

import { DialogTitle } from '../Modal';

import { TokenGateContent } from './components/TokenGateContent';
import { useTokenGateModal } from './hooks/useTokenGateModalContext';
import { getTitle } from './utils/helpers';

function TokenGateModal() {
  const { displayedPage } = useTokenGateModal();

  return (
    <Box display='flex' gap={2} flexDirection='column'>
      <Legend>{getTitle(displayedPage)}</Legend>
      <TokenGateContent />
    </Box>
  );
}

export default TokenGateModal;
