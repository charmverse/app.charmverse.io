import styled from '@emotion/styled';
import { ListItem, ListItemButton, Tooltip } from '@mui/material';
import React from 'react';

export type MenuButtonProps = {
  children: React.ReactNode;
  isActive?: boolean;
  isDisabled?: boolean;
  hints: string[];
  onClick?: React.MouseEventHandler;
  'data-test'?: string;
};

const StyledMenuButton = styled(ListItemButton, { shouldForwardProp: (prop) => prop !== 'active' })<{
  active: boolean;
}>`
  position: relative;
  cursor: pointer;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: ${({ theme }) => theme.spacing(0.75, 0.5)};
  ${(props) => (props.active ? 'color: var(--primary-color);' : '')}

  & svg {
    display: block;
    height: 1.25em;
    width: 1.25em;
    fill: currentcolor;
  }

  ${(props) => props.theme.breakpoints.down('md')} {
    min-width: 40px;
    min-height: 46px;
    justify-content: center;
  }
`;

export function MenuButton({
  children,
  isActive = false,
  isDisabled,
  hints,
  onClick,
  'data-test': dataTest
}: MenuButtonProps) {
  return (
    <Tooltip
      title={
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          {hints.map((hint, hintIndex) => (
            <div
              style={{
                fontSize: hintIndex === 0 ? 16 : 12,
                color: hintIndex === 0 ? 'inherit' : '#aaa'
              }}
              key={hint}
            >
              {hint}
            </div>
          ))}
        </div>
      }
      arrow
      placement='top'
    >
      <ListItem disablePadding component='div'>
        <StyledMenuButton
          disabled={isDisabled}
          sx={{
            pointerEvents: isDisabled ? 'none' : 'initial'
          }}
          aria-label={hints.join('\n')}
          active={isActive}
          data-test={dataTest}
          onClick={onClick}
        >
          {children}
        </StyledMenuButton>
      </ListItem>
    </Tooltip>
  );
}
