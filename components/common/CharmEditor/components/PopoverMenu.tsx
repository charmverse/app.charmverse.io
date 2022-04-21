import { ReactNode } from 'react';
import styled from '@emotion/styled';
import { ClickAwayListener, Grow, MenuItem, Paper } from '@mui/material';
import Portal from '@mui/material/Portal';

interface Props {
  container: Element;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
}

const StyledPaper = styled(Paper)`

  // z-index: 10000; // raise above the app bar

  max-height: 40vh;
  overflow-y: auto;
`;

export default function PopoverMenu ({ children, container, isOpen, width = 250, onClose }: Props) {
  if (!isOpen) {
    return null;
  }
  return (
    <Portal container={container}>
      <ClickAwayListener onClickAway={onClose}>
        <Grow
          in={true}
          style={{
            transformOrigin: 'left top'
          }}
        >
          <StyledPaper sx={{ width }}>
            {children}
          </StyledPaper>
        </Grow>
      </ClickAwayListener>
    </Portal>
  );
}

export const GroupLabel = styled((props: any) => <MenuItem disabled {...props} />)`
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 600;
  color: ${({ theme }) => theme.palette.secondary.main};
  opacity: 1 !important;
`;
