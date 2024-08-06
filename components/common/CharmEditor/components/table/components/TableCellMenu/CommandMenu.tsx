import { Divider, ListItemButton, Menu, MenuItem, ListItemText } from '@mui/material';
import type { EditorState, Transaction } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import type { SyntheticEvent, ReactNode } from 'react';
import React from 'react';

import type UICommand from '../../ui/UICommand';

export type CommandMenuProps = {
  commandGroups: any[]; // { [string]: UICommand }[];
  dispatch: (tr: Transaction) => void;
  editorState: EditorState;
  editorView: EditorView;
  onCommand: VoidFunction | null;
};

export class CommandMenu extends React.PureComponent<CommandMenuProps> {
  _activeCommand: UICommand | null = null;

  _onUIEnter = (command: UICommand, event: SyntheticEvent): void => {
    if (this._activeCommand) this._activeCommand.cancel();
    this._activeCommand = command;
    this._execute(command, event);
  };

  _execute = (command: UICommand, e: SyntheticEvent) => {
    const { dispatch, editorState, editorView, onCommand } = this.props;
    if (command.execute(editorState, dispatch, editorView, e)) {
      if (onCommand) onCommand();
    }
  };

  render() {
    const { commandGroups, editorState, editorView } = this.props;
    const children: ReactNode[] = [];
    const jj = commandGroups.length - 1;

    commandGroups.forEach((group, ii) => {
      Object.keys(group).forEach((label) => {
        const command = group[label];
        let disabled = true;
        try {
          disabled = !editorView || !command.isEnabled(editorState, editorView);
        } catch (ex) {
          disabled = false;
        }
        children.push(
          <ListItemButton
            dense
            selected={command.isActive(editorState)}
            disabled={disabled}
            key={label}
            onClick={(e) => this._onUIEnter(command, e)}
          >
            <ListItemText>{command.renderLabel(editorState) || label}</ListItemText>
          </ListItemButton>
        );
      });
      if (ii !== jj) {
        children.push(<Divider />);
      }
    });
    // The popup will use Menu component so no need to wrap it with List
    return children; // <List sx={{ bgcolor: 'background.paper' }}>{children}</List>;
  }
}
