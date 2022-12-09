import styled from '@emotion/styled';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import { capitalize } from 'lib/utilities/strings';
import type { BrandColor } from 'theme/colors';
import { colors } from 'theme/colors';

import { GroupLabel } from '../PopoverMenu';

type Props = { children: ReactNode };

const LetterIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  height: 20px;
  width: 20px;
  font-weight: 700;
`;

function getCSSColor(color: string) {
  return colors[color as BrandColor] ? `var(--prop-${color})` : undefined;
}

export function TextColorMenuDropdown({ children }: Props) {
  const menuState = usePopupState({ variant: 'popover', popupId: 'textColorMenu' });
  const colorOptions = ['default'].concat(Object.keys(colors));
  return (
    <>
      <Menu {...bindMenu(menuState)} sx={{ maxHeight: 500 }} MenuListProps={{ sx: { p: 0 } }}>
        <GroupLabel>Color</GroupLabel>
        {colorOptions.map((color) => (
          <MenuItem dense key={color}>
            <ListItemIcon sx={{ color: getCSSColor(color) }}>
              <LetterIcon>A</LetterIcon>
            </ListItemIcon>
            <ListItemText>{capitalize(color)}</ListItemText>
          </MenuItem>
        ))}
        <GroupLabel>Background</GroupLabel>
        {colorOptions.map((color) => (
          <MenuItem dense key={color}>
            <ListItemIcon>
              <LetterIcon style={{ backgroundColor: getCSSColor(color) }}>A</LetterIcon>
            </ListItemIcon>
            <ListItemText sx={{ pr: 2 }}>{capitalize(color)} background</ListItemText>
          </MenuItem>
        ))}
      </Menu>
      <div {...bindTrigger(menuState)}>{children}</div>
    </>
  );
}
