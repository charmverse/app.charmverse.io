import { Popover } from '@mui/material';
import Paper from '@mui/material/Paper';
import PopupState, { bindPopover, bindToggle } from 'material-ui-popup-state';
import * as React from 'react';

interface PopperPopupProps {
  popupContent: React.ReactNode
  children?: React.ReactNode | null
}

export default function PopperPopup (props: PopperPopupProps) {
  const { popupContent, children } = props;
  return (
    <PopupState variant='popper'>
      {(popupState) => (
        <div>
          {children && (
          <div {...bindToggle(popupState)}>
            {children}
          </div>
          )}
          <Popover
            {...bindPopover(popupState)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'center'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'center'
            }}
          >
            <Paper>
              {popupContent}
            </Paper>
          </Popover>
        </div>
      )}
    </PopupState>
  );
}
