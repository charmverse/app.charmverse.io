
import styled from '@emotion/styled';
import { ListItem, Tooltip } from '@mui/material';
import React from 'react';

export interface MenuButtonProps {
  className?: string;
  children: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  hints: string[];
  onMouseDown?: React.MouseEventHandler;
  disableButton?: boolean;
}

const StyledMenuButton = styled.div<{ active: boolean }>`
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(0.5)};
  ${props => props.active && 'background-color: rgb(0, 0, 0, 0.125);'};

  & svg {
    display: block;
    height: 1.25em;
    width: 1.25em;
    fill: currentcolor;
  }
`;

export function MenuButton ({
  className = '',
  children,
  isActive = false,
  isDisabled,
  hints,
  onMouseDown,
  disableButton = false
}: MenuButtonProps) {
  return (
    <Tooltip
      title={(
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
        >
          {
        hints.map((hint, hintIndex) => (
          <div
            style={{
              fontSize: hintIndex === 0 ? 16 : 12,
              color: hintIndex === 0 ? 'inherit' : '#aaa'
            }}
            key={hint}
          >{hint}
          </div>
        ))
      }
        </div>
      )}
      arrow
      placement='top'
    >
      <ListItem disabled={isDisabled} button={!disableButton as any} component='div' sx={{ py: 0, px: 0, mx: 0.25, my: 0, borderRadius: 0.5 }}>
        <StyledMenuButton
          aria-label={hints.join('\n')}
          active={isActive}
          onMouseDown={onMouseDown}
          className={className}
        >
          {children}
        </StyledMenuButton>
      </ListItem>
    </Tooltip>
  );
}
