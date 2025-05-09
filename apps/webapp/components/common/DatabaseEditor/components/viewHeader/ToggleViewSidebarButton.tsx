import MoreHorizOutlinedIcon from '@mui/icons-material/MoreHorizOutlined';
import { Box } from '@mui/material';
import React from 'react';

import IconButton from '../../widgets/buttons/iconButton';

type Props = {
  onClick: (e: React.MouseEvent) => void;
};

export function ToggleViewSidebarButton(props: Props) {
  return (
    <Box ml={0} mr={1} data-test='view-header-actions-menu'>
      <IconButton
        tooltip='Edit view layout, grouping, and more...'
        icon={<MoreHorizOutlinedIcon fontSize='small' />}
        onClick={props.onClick}
        style={{ width: '32px' }}
      />
    </Box>
  );
}
