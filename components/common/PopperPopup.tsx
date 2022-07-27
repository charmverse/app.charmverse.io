import { Popover, PopoverProps } from '@mui/material';
import Paper from '@mui/material/Paper';
import { bindPopover, bindToggle } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef } from 'react';

interface PopperPopupProps {
  popupContent: React.ReactNode;
  children?: React.ReactNode | null;
  autoOpen?: boolean;
}

export default function PopperPopup (props: PopperPopupProps) {

  const { popupContent, children, autoOpen = false } = props;

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
    if (autoOpen && toggleRef.current) {
      popupState.setAnchorEl(toggleRef.current);
      setTimeout(() => {
        popupState.open();
      });
    }
  }, [toggleRef, autoOpen]);

  return (
    <div ref={toggleRef}>
      {children && (
      <div {...bindToggle(popupState)}>
        {children}
      </div>
      )}
      <Popover
        disableRestoreFocus
        {...popoverProps}
      >
        <Paper>
          {popupContent}
        </Paper>
      </Popover>
    </div>
  );
}
