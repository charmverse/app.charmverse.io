import styled from '@emotion/styled';
import { ListItemIcon, ListItemText, Menu, MenuItem } from '@mui/material';
import { capitalize } from '@packages/utils/strings';
import { usePopupState, bindTrigger, bindMenu } from 'material-ui-popup-state/hooks';
import type { ReactNode } from 'react';

import { useEditorViewContext } from 'components/common/CharmEditor/components/@bangle.dev/react/hooks';
import { colors } from 'theme/colors';

import { GroupLabel } from '../PopoverMenu';

import type { TextColorAttrs } from './config';
import { executeWithUserInput } from './textColorCommands';
import { getCSSColor } from './textColorUtils';

type Props = { children: ReactNode };

const LetterIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 2px;
  height: 22px;
  width: 22px;
  font-weight: 700;
  font-size: 16px;
  ${({ theme }) => (theme.palette.mode === 'dark' ? '' : 'border: 1px solid var(--bg-gray);')};
`;

export function TextColorMenuDropdown({ children }: Props) {
  const menuState = usePopupState({ variant: 'popover', popupId: 'textColorMenu' });
  const view = useEditorViewContext();
  const colorOptions = ['default'].concat(Object.keys(colors));

  function setColor(attrs: TextColorAttrs) {
    executeWithUserInput(view.state, view.dispatch, view, attrs);
    menuState.close();
  }

  return (
    <>
      <Menu {...bindMenu(menuState)} sx={{ maxHeight: 400 }} MenuListProps={{ sx: { p: 0 } }}>
        <GroupLabel>Color</GroupLabel>
        {colorOptions.map((color) => (
          <MenuItem dense key={color} onClick={() => setColor({ color })}>
            <ListItemIcon sx={{ color: getCSSColor('text', color) }}>
              <LetterIcon>A</LetterIcon>
            </ListItemIcon>
            <ListItemText>{capitalize(color)}</ListItemText>
          </MenuItem>
        ))}
        <GroupLabel>Background</GroupLabel>
        {colorOptions.map((color) => (
          <MenuItem dense key={color} onClick={() => setColor({ bgColor: color })}>
            <ListItemIcon>
              <LetterIcon style={{ backgroundColor: getCSSColor('bg', color) }}>A</LetterIcon>
            </ListItemIcon>
            <ListItemText sx={{ pr: 2 }}>{capitalize(color)} background</ListItemText>
          </MenuItem>
        ))}
      </Menu>
      <div {...bindTrigger(menuState)}>{children}</div>
    </>
  );
}
