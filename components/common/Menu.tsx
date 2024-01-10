import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Menu, MenuItem } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { usePopupState, bindMenu, bindTrigger } from 'material-ui-popup-state/hooks';
import { v4 } from 'uuid';

import { Button } from 'components/common/Button';
import { StyledListItemText } from 'components/common/StyledListItemText';

export interface MenuOption<T = any> {
  value: T;
  primary: string;
  secondary?: string;
}

interface Props {
  selectedValue: string;
  title?: string;
  loading?: boolean;
  valueUpdated: (value: string) => void;
  options: MenuOption[];
  closeOnSelect?: boolean;
  buttonSize?: string;
  disabled?: boolean;
}

export default function SelectMenu({
  selectedValue,
  valueUpdated,
  options,
  loading = false,
  title,
  closeOnSelect = true,
  buttonSize,
  disabled
}: Props) {
  const popupState = usePopupState({ variant: 'popover', popupId: `menu-${v4()}` });

  const selectedLabel = options.find((opt) => opt.value === selectedValue)?.primary;

  return (
    <Box display='block'>
      {title && (
        <Typography display='block' variant='caption'>
          {title}
        </Typography>
      )}
      <Button
        color='secondary'
        variant='outlined'
        disabled={loading || disabled}
        loading={loading}
        size={buttonSize}
        endIcon={!loading && <KeyboardArrowDownIcon fontSize='small' />}
        {...bindTrigger(popupState)}
      >
        {selectedLabel}
      </Button>
      <Menu
        {...bindMenu(popupState)}
        PaperProps={{
          sx: { width: 300 }
        }}
      >
        {options.map((opt) => {
          const { value, primary, secondary } = opt;

          return (
            <MenuItem
              key={value.primary}
              selected={selectedValue === value}
              onClick={() => {
                valueUpdated(value);
                if (closeOnSelect) {
                  popupState.close();
                }
              }}
              disabled={loading || disabled}
            >
              <StyledListItemText primary={primary} secondary={secondary} />
            </MenuItem>
          );
        })}
      </Menu>
    </Box>
  );
}
