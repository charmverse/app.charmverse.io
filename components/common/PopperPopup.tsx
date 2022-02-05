import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';
import Popper from '@mui/material/Popper';
import PopupState, { bindPopper, bindToggle } from 'material-ui-popup-state';
import * as React from 'react';

interface PopperPopupProps {
  popupContent: React.ReactNode
  children: React.ReactNode
}

export default function PopperPopup (props: PopperPopupProps) {
  const { popupContent, children } = props;
  return (
    <PopupState variant='popper'>
      {(popupState) => (
        <div>
          <div {...bindToggle(popupState)}>
            {children}
          </div>
          <Popper {...bindPopper(popupState)} transition>
            {({ TransitionProps }) => (
              <Fade {...TransitionProps} timeout={350}>
                <Paper>
                  {popupContent}
                </Paper>
              </Fade>
            )}
          </Popper>
        </div>
      )}
    </PopupState>
  );
}
