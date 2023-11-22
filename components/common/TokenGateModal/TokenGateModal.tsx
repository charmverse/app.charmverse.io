import Box from '@mui/material/Box';

import { DialogTitle } from '../Modal';

import { SingleConditionSelect } from './components/SingleConditionSelect';
import { useTokenGateModal } from './hooks/useTokenGateModalContext';
import { getTitle } from './utils/helpers';

function TokenGateModal() {
  const { displayedPage, flow } = useTokenGateModal();

  return (
    <Box>
      <DialogTitle>{getTitle(displayedPage)}</DialogTitle>
      {flow === 'singleCondition' && <SingleConditionSelect />}
    </Box>
  );
}

export default TokenGateModal;
