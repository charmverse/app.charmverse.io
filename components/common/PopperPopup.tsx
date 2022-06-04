import { Popover } from '@mui/material';
import Paper from '@mui/material/Paper';
import { bindPopover, bindToggle } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef } from 'react';

interface PopperPopupProps {
  popupContent: React.ReactNode;
  children?: React.ReactNode | null;
}

export default function PopperPopup (props: PopperPopupProps) {

  const { popupContent, children } = props;

  const popupState = usePopupState({ variant: 'popper', popupId: 'iframe-selector' });
  const toggleRef = useRef(null);

  useEffect(() => {
    if (toggleRef.current) {
      popupState.setAnchorEl(toggleRef.current);
      popupState.open();
    }
  }, [toggleRef]);

  return (
    <div ref={toggleRef}>
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
  );
}
