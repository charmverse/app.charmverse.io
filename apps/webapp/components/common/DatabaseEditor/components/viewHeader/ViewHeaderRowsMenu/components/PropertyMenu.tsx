import { styled } from '@mui/material';
import { Menu, ListItemText, ListItemIcon, MenuItem, Tooltip } from '@mui/material';
import { usePopupState } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';
import { useRef, useState } from 'react';

export const StyledMenuItem = styled(MenuItem, {
  shouldForwardProp: (prop) => prop !== 'lastChild' && prop !== 'firstChild'
})<{
  firstChild?: boolean;
  lastChild?: boolean;
}>(
  ({ firstChild, lastChild, theme }) => `
  border-left: 1px solid ${theme.palette.divider};
  border-top: 1px solid ${theme.palette.divider};
  border-bottom: 1px solid ${theme.palette.divider};
  padding: ${theme.spacing(0.5, 1)};
  display: flex;
  align-items: center;
  cursor: pointer;
  transition: background 0.2s ease-in-out;
  color: ${theme.palette.text.primary};

  &:hover {
    background: ${theme.palette.action.hover};
    transition: background 0.2s ease-in-out;
  }

  ${firstChild ? `border-radius: 4px 0 0 4px;` : ''}
  ${
    lastChild
      ? `
    border-right: 1px solid ${theme.palette.divider};
    border-radius: 0 4px 4px 0;
    `
      : ''
  }
`
);

export function PropertyMenu({
  disabledTooltip,
  propertyTemplate,
  children,
  lastChild
}: {
  disabledTooltip?: string;
  propertyTemplate: { icon?: ReactNode; name: string };
  children: ReactNode | ((option: { isPropertyOpen: boolean; closeMenu: VoidFunction }) => ReactNode);
  lastChild: boolean;
}) {
  const popupState = usePopupState({ variant: 'popover' });
  // Without this state, the options menu list is not placed in the correct position
  const [isPropertyOpen, setIsPropertyOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);
  return (
    <>
      <Tooltip title={disabledTooltip ?? ''}>
        <div>
          <StyledMenuItem
            disabled={!!disabledTooltip}
            lastChild={lastChild}
            ref={ref}
            onClick={() => {
              popupState.open();
              setTimeout(() => {
                setIsPropertyOpen(true);
              }, 150);
            }}
          >
            {propertyTemplate.icon && (
              // override large minWidth set by MUI
              <ListItemIcon sx={{ minWidth: '20px !important' }}>{propertyTemplate.icon}</ListItemIcon>
            )}
            <ListItemText>{propertyTemplate.name}</ListItemText>
          </StyledMenuItem>
        </div>
      </Tooltip>

      <Menu
        anchorEl={ref.current}
        open={popupState.isOpen}
        elevation={1}
        onClose={() => {
          popupState.close();
          setIsPropertyOpen(false);
        }}
      >
        {typeof children === 'function' ? children({ isPropertyOpen, closeMenu: popupState.close }) : children}
      </Menu>
    </>
  );
}
