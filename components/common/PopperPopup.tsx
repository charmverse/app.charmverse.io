import { Popover, PopoverProps } from '@mui/material';
import Paper from '@mui/material/Paper';
import PopupState, { bindPopover, bindToggle } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef } from 'react';

interface PopperPopupProps {
  popupContent: React.ReactNode;
  children?: React.ReactNode | null;
  autoOpen?: boolean;
  open?: boolean;
}

export default function PopperPopup (props: PopperPopupProps) {

  const { popupContent, children, autoOpen = false, open = false } = props;

  const popupState = usePopupState({ variant: 'popper', popupId: 'iframe-selector' });
  const toggleRef = useRef(null);

  const popoverProps: PopoverProps = {
    ...bindPopover(popupState),
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'center'
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'center'
    }
  };

  useEffect(() => {
    if ((autoOpen || open) && toggleRef.current) {
      popupState.setAnchorEl(toggleRef.current);
      setTimeout(() => {
        popupState.open();
      });
    }
  }, [toggleRef, autoOpen, open]);

  return (autoOpen || open) ? (
    <div ref={toggleRef}>
      {children && (
      <div {...bindToggle(popupState)}>
        {children}
      </div>
      )}
      <Popover
        {...popoverProps}
      >
        <Paper>
          {popupContent}
        </Paper>
      </Popover>
    </div>
  ) : (
    <PopupState variant='popper'>
      {(_popupState) => (
        <div>
          {children && (
          <div {...bindToggle(_popupState)}>
            {children}
          </div>
          )}
        </div>
      )}
    </PopupState>
  );
}
