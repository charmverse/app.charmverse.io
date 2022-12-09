import type { PopoverProps } from '@mui/material';
import { Popover } from '@mui/material';
import Paper from '@mui/material/Paper';
import { bindPopover, bindToggle } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef } from 'react';

interface PopperPopupProps {
  popupContent: React.ReactNode;
  children?: React.ReactNode | null;
  autoOpen?: boolean;
  closeOnClick?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: () => void;
}

export default function PopperPopup(props: PopperPopupProps) {
  const { closeOnClick = false, popupContent, children, autoOpen = false, onClose, onOpen } = props;

  const popupState = usePopupState({ variant: 'popper', popupId: 'iframe-selector' });
  const toggleRef = useRef(null);

  const popover = bindPopover(popupState);
  const popoverProps: PopoverProps = {
    ...popover,
    anchorOrigin: {
      vertical: 'bottom',
      horizontal: 'center'
    },
    transformOrigin: {
      vertical: 'top',
      horizontal: 'center'
    },
    onClick: (e) => {
      e.stopPropagation();
    }
  };

  const popoverToggle = bindToggle(popupState);
  const popoverToggleProps: typeof popoverToggle = {
    ...popoverToggle,
    onClick: (e) => {
      e.stopPropagation();
      onOpen?.();
      popoverToggle.onClick(e);
    }
  };

  if (closeOnClick) {
    popoverProps.onClick = () => {
      popupState.close();
    };
  }

  if (onClose) {
    popoverProps.onClose = () => {
      onClose();
      popupState.close();
    };
  }

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
        <div {...popoverToggleProps} onMouseDown={(e) => e.preventDefault()}>
          {children}
        </div>
      )}
      <Popover disableRestoreFocus {...popoverProps}>
        <Paper>{popupContent}</Paper>
      </Popover>
    </div>
  );
}
