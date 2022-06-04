import { Popover } from '@mui/material';
import Paper from '@mui/material/Paper';
import { bindPopover, bindToggle } from 'material-ui-popup-state';
import { PopupState } from 'material-ui-popup-state/hooks';
import * as React from 'react';

interface PopperPopupProps {
  popupContent: React.ReactNode;
  popupState: PopupState;
  children?: React.ReactNode | null;
}

export default function PopperPopup (props: PopperPopupProps) {
  const { popupContent, popupState, children } = props;
  console.log('popupState', popupState);
  const toggleRef = React.useRef(null);
  React.useEffect(() => {
    if (toggleRef.current) {
      console.log('set anchor', toggleRef.current);
      popupState.setAnchorEl(toggleRef.current);
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
