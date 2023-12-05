import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Box, Menu, MenuItem } from '@mui/material';
import { bindMenu, bindTrigger, usePopupState } from 'material-ui-popup-state/hooks';

import { Button } from 'components/common/Button';

import type { Flow } from '../hooks/useTokenGateModalContext';

export function TokenGateAddMultipleButton({ onClick }: { onClick: (flow: Flow) => void }) {
  const menuPopupState = usePopupState({ variant: 'popover', popupId: 'multiple-gates-menu' });

  return (
    <Box width='100%' display='flex' justifyContent='left' position='relative'>
      <Button
        id='multiple-gates-button'
        aria-expanded={menuPopupState.isOpen ? 'true' : undefined}
        variant='outlined'
        disableElevation
        endIcon={<KeyboardArrowDownIcon />}
        {...bindTrigger(menuPopupState)}
      >
        Add another gate
      </Button>
      <Menu
        id='multiple-gates-menu'
        MenuListProps={{
          'aria-labelledby': 'multiple-gates-button'
        }}
        onClick={menuPopupState.close}
        {...bindMenu(menuPopupState)}
      >
        <MenuItem onClick={() => onClick('multiple_all')}>Should satisfy all</MenuItem>
        <MenuItem onClick={() => onClick('multiple_one')}>Should satisfy at least one</MenuItem>
      </Menu>
    </Box>
  );
}
