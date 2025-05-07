import { Edit as EditIcon } from '@mui/icons-material';
import { Box, IconButton } from '@mui/material';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import React from 'react';
import { v1 as uuid } from 'uuid';

import createPopUp from '../../ui/createPopUp';
import type { PopUpHandle } from '../../ui/createPopUp';
import { TABLE_COMMANDS_GROUP } from '../../ui/EditorToolbarConfig';

import type { CommandMenuProps } from './CommandMenu';
import { CommandMenu } from './CommandMenu';

type Props = {
  editorState: EditorState;
  editorView: EditorView;
};

class CommandMenuButton extends React.PureComponent<{
  commandGroups: any[]; // Array<{ [string]: UICommand }>;
  disabled?: boolean | null;
  dispatch: (tr: Transaction) => void;
  editorState: EditorState;
  editorView: EditorView;
}> {
  _menu: PopUpHandle<Props> | null = null;

  _id = uuid();

  state = {
    expanded: false
  };

  componentWillUnmount(): void {
    this._hideMenu();
  }

  _onClick = (): void => {
    const expanded = !(this as CommandMenuButton).state.expanded;

    this.setState({
      expanded
    });
    // eslint-disable-next-line no-unused-expressions
    expanded ? this._showMenu() : this._hideMenu();
  };

  _hideMenu = (): void => {
    const menu = this._menu;
    this._menu = null;
    if (menu) menu.close();
  };

  _showMenu = (): void => {
    const menu = this._menu;
    const menuProps: CommandMenuProps = {
      ...this.props,
      onCommand: this._onCommand
    };
    if (menu) {
      menu.update(menuProps);
    } else {
      // @ts-ignore
      this._menu = createPopUp(CommandMenu, menuProps, {
        anchor: document.getElementById(this._id),
        onClose: this._onClose,
        popper: 'menu'
      });
    }
  };

  _onCommand = (): void => {
    this.setState({ expanded: false });
    this._hideMenu();
  };

  _onClose = (): void => {
    if (this._menu) {
      this.setState({ expanded: false });
      this._menu = null;
    }
  };

  render() {
    const { commandGroups, editorState, editorView, disabled } = this.props;
    const enabled =
      !disabled &&
      commandGroups.some((group, ii) => {
        return Object.keys(group).some((label) => {
          const command = group[label];
          let disabledVal = true;
          try {
            disabledVal = !editorView || !command.isEnabled(editorState, editorView);
          } catch (ex) {
            disabledVal = false;
          }
          return !disabledVal;
        });
      });

    const { expanded } = this.state;
    // let buttonClassName = (className ? className + ' ' : '') + 'czi-custom-menu-button';
    // if (expanded) {
    //   buttonClassName += ' expanded';
    // }

    return (
      <Box sx={{ position: 'relative', top: '24px', mx: '4px' }}>
        <IconButton
          sx={{ borderRadius: '3px', p: '2px' }}
          size='small'
          disabled={!enabled}
          id={this._id}
          onClick={this._onClick}
        >
          <EditIcon sx={{ fontSize: 16, pointerEvents: 'none' }} />
        </IconButton>
      </Box>
    );
  }
}

export function TableCellMenu({ editorState, editorView }: Props) {
  return (
    <CommandMenuButton
      commandGroups={TABLE_COMMANDS_GROUP}
      dispatch={editorView.dispatch}
      editorState={editorState}
      editorView={editorView}
    />
  );
}
