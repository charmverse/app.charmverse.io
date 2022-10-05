import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { Box } from '@mui/material';
import React from 'react';

import IconButton from '../../widgets/buttons/iconButton';

type Props = {
  onClick: () => void;
}

const ViewHeaderActionsMenu = React.memo((props: Props) => {

  return (
    <Box ml={0} mr={1}>
      <IconButton icon={<MoreHorizOutlinedIcon fontSize='small' />} onClick={props.onClick} style={{ width: '32px' }} />
    </Box>
  );
});

export default ViewHeaderActionsMenu;
