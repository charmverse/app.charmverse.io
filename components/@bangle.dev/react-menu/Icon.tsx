import { HintPos } from '@bangle.dev/react-menu/dist/types';
import styled from '@emotion/styled';
import { ListItem } from '@mui/material';
import React from 'react';

export interface MenuButtonProps {
  className?: string;
  children: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  hint: string;
  hintPos?: HintPos;
  hintBreakWhiteSpace?: boolean;
  onMouseDown?: React.MouseEventHandler;
}

const StyledMenuButton = styled.div<{ active: boolean }>`
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(0.5)};

  & svg {
    display: block;
    height: 1.5em;
    width: 1.5em;
    fill: currentcolor;
  }
`

export const MenuButton = ({
  className = '',
  children,
  isActive = false,
  isDisabled,
  hint,
  onMouseDown,
}: MenuButtonProps) => {
  return (
    <ListItem disabled={isDisabled} button component="div" sx={{ py: 0, px: 0 }}>
      <StyledMenuButton
        aria-label={hint}
        active={isActive}
        onMouseDown={onMouseDown}
        className={className}
      >
        {children}
      </StyledMenuButton>
    </ListItem>
  );
};