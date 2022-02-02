import { HintPos } from '@bangle.dev/react-menu/dist/types';
import styled from '@emotion/styled';
import { ListItem, Tooltip } from '@mui/material';
import React from 'react';

export interface MenuButtonProps {
  className?: string;
  children: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  hints: string[];
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
  ${props => props.active && `background-color: rgb(0, 0, 0, 0.125);`};

  & svg {
    display: block;
    height: 1.25em;
    width: 1.25em;
    fill: currentcolor;
  }
`

export const MenuButton = ({
  className = '',
  children,
  isActive = false,
  isDisabled,
  hints,
  onMouseDown,
}: MenuButtonProps) => {
  return (
    <Tooltip title={<div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {
        hints.map((hint, hintIndex) => <div style={{
          fontSize: hintIndex === 0 ? 16 : 12,
          color: hintIndex === 0 ? "inherit" : "#aaa"
        }} key={hint}>{hint}</div>)
      }
    </div>} arrow placement='bottom'>
      <ListItem disabled={isDisabled} button component="div" sx={{ py: 0, px: 0, mx: 0.25, my: 0, borderRadius: 0.5 }}>
        <StyledMenuButton
          aria-label={hints.join("\n")}
          active={isActive}
          onMouseDown={onMouseDown}
          className={className}
        >
          {children}
        </StyledMenuButton>
      </ListItem>
    </Tooltip>
  );
};