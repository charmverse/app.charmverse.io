import React from 'react';
import { Box } from '@mui/material';
import IconButton from '../../widgets/buttons/iconButton';
import OptionsIcon from '../../widgets/icons/options';

type Props = {
  onClick: () => void
}

const ViewHeaderActionsMenu = React.memo((props: Props) => {

  return (
    <Box ml={0} mr={1}>
      <IconButton icon={<OptionsIcon />} onClick={props.onClick} style={{ width: '32px' }} />
    </Box>
  );
});

export default ViewHeaderActionsMenu;
