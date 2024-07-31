import { Edit as EditIcon } from '@mui/icons-material';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import { Box, IconButton } from '@mui/material';

import type { Transaction } from 'prosemirror-state';
import React from 'react';

import { TABLE_COMMANDS_GROUP } from '../../ui/EditorToolbarConfig';
import CommandMenu, { CommandMenuProps } from './CommandMenu';
import createPopUp from '../../ui/createPopUp';
import { PopUpHandle } from '../../ui/createPopUp';
import { v1 as uuid } from 'uuid';

type Props = {
  editorState: EditorState;
  editorView: EditorView;
};

export function TableCellMenu({ editorState, editorView }: Props) {
  return (
    <CommandMenuButton
      className='czi-table-cell-menu'
      commandGroups={TABLE_COMMANDS_GROUP}
      dispatch={editorView.dispatch}
      editorState={editorState}
      editorView={editorView}
    />
  );
}

class CommandMenuButton extends React.PureComponent<{
  className?: string | null;
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
      <Box sx={{ position: 'relative', top: '24px', right: '4px' }}>
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

  componentWillUnmount(): void {
    this._hideMenu();
  }

  _onClick = (): void => {
    const expanded = !this.state.expanded;

    this.setState({
      expanded
    });
    expanded ? this._showMenu() : this._hideMenu();
  };

  _hideMenu = (): void => {
    const menu = this._menu;
    this._menu = null;
    menu && menu.close();
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
        onClose: this._onClose
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
}

export default CommandMenuButton;
