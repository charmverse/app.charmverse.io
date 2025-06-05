import type { PopoverProps, SxProps, Theme } from '@mui/material';
import { Popover } from '@mui/material';
import Paper from '@mui/material/Paper';
import { bindPopover, bindToggle } from 'material-ui-popup-state';
import { usePopupState } from 'material-ui-popup-state/hooks';
import { useEffect, useRef } from 'react';

interface PopperPopupProps {
  popupContent: React.ReactNode;
  children?: React.ReactNode | null;
  autoOpen?: boolean;
  open?: boolean; // use this prop to control popover from outside
  closeOnClick?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  onClick?: () => void;
  paperSx?: SxProps<Theme>;
  style?: React.CSSProperties;
  popoverProps?: Partial<PopoverProps>;
  toggleStyle?: any;
  disablePopup?: boolean;
}

export default function PopperPopup(props: PopperPopupProps) {
  const {
    style = {},
    closeOnClick = false,
    popupContent,
    children,
    autoOpen = false,
    onClose,
    onOpen,
    open,
    disablePopup,
    popoverProps: customPopoverProps = {},
    toggleStyle
  } = props;

  const popupState = usePopupState({ variant: 'popper', popupId: 'iframe-selector' });
  const toggleRef = useRef<HTMLDivElement>(null);

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
    ...customPopoverProps,
    onClick: (e) => {
      e.stopPropagation();
    }
  };

  const popoverToggle = bindToggle(popupState);
  const popoverToggleProps: typeof popoverToggle = {
    ...popoverToggle,
    onClick: (e) => {
      e.stopPropagation();
      if (!disablePopup) {
        onOpen?.();
        popoverToggle.onClick(e);
      }
    }
  };

  if (closeOnClick) {
    popoverProps.onClick = (e) => {
      e.stopPropagation();
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

  useEffect(() => {
    if (!toggleRef.current || typeof open !== 'boolean') {
      return;
    }
    if (open) {
      popupState.setAnchorEl(toggleRef.current);
      setTimeout(() => {
        popupState.open();
      });
    } else {
      popupState.close();
    }
  }, [toggleRef, open]);

  return (
    <div ref={toggleRef} style={style}>
      {children && (
        <div {...popoverToggleProps} onMouseDown={(e) => e.preventDefault()} style={toggleStyle}>
          {children}
        </div>
      )}
      <Popover {...popoverProps}>
        <Paper sx={props.paperSx}>{popupContent}</Paper>
      </Popover>
    </div>
  );
}
