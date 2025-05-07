import type { SxProps, Theme } from '@mui/material';
import type { ReactNode } from 'react';

import PopperPopup from 'components/common/PopperPopup';

type Props = {
  disabled?: boolean;
  height?: number | string;
  activeField: ReactNode;
  previewField: ReactNode;
  paperSx?: SxProps<Theme>;
};

export function PopupFieldWrapper({ disabled, height, activeField, previewField, paperSx = {} }: Props) {
  return (
    <PopperPopup
      style={{
        width: '100%',
        height: '100%'
      }}
      paperSx={{
        '& .MuiInputBase-root.MuiAutocomplete-inputRoot ': (theme) => ({
          padding: `6px 16px !important`,
          borderBottom: `1px solid ${theme.palette.divider}`,
          minHeight: `41px`
        }),
        width: 350,
        height,
        ...paperSx
      }}
      popoverProps={{
        anchorOrigin: {
          vertical: 'top',
          horizontal: 'left'
        },
        // transform origin to fit table cell paddings
        transformOrigin: {
          vertical: 9,
          horizontal: 9
        }
      }}
      toggleStyle={{ height: '100%' }}
      popupContent={activeField}
      disablePopup={disabled}
    >
      {previewField}
    </PopperPopup>
  );
}
