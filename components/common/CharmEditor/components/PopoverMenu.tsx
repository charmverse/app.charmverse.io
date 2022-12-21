import styled from '@emotion/styled';
import { ClickAwayListener, Grow, MenuItem, Paper } from '@mui/material';
import Portal from '@mui/material/Portal';
import type { ReactNode } from 'react';

interface Props {
  container: Element;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: number;
  maxHeight?: string;
}

const StyledPaper = styled(Paper)<{ maxheight: string }>`
  max-height: ${(props) => props.maxheight};
  width: 320px;
  overflow-y: auto;
  padding: 0 5px;
`;

export default function PopoverMenu({ children, container, maxHeight = '40vh', isOpen, width = 250, onClose }: Props) {
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
          <StyledPaper maxheight={maxHeight} sx={{ width }}>
            {children}
          </StyledPaper>
        </Grow>
      </ClickAwayListener>
    </Portal>
  );
}

export const GroupLabel = styled((props: any) => <MenuItem disabled {...props} />)`
  font-size: 0.75em;
  text-transform: uppercase;
  font-weight: 700;
  color: ${({ theme }) => theme.palette.secondary.main};
  opacity: 1 !important;
`;
