import type { EditorState } from 'prosemirror-state';
import type { Transform } from 'prosemirror-transform';
import type { EditorView } from 'prosemirror-view';
import type { SyntheticEvent } from 'react';
import React from 'react';

import CustomMenu from './CustomMenu';
import CustomMenuItem from './CustomMenuItem';
import type UICommand from './UICommand';

class CommandMenu extends React.PureComponent<{
  commandGroups: any[]; // { [string]: UICommand }[];
  dispatch: (tr: Transform) => void;
  editorState: EditorState;
  editorView: EditorView | null;
  onCommand: VoidFunction | null;
}> {
  _activeCommand: UICommand | null = null;

  render() {
    const { commandGroups, editorState, editorView } = this.props;
    const children = [];
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
          <CustomMenuItem
            active={command.isActive(editorState)}
            disabled={disabled}
            key={label}
            label={command.renderLabel(editorState) || label}
            onClick={this._onUIEnter}
            onMouseEnter={this._onUIEnter}
            value={command}
          />
        );
      });
      if (ii !== jj) {
        children.push(<CustomMenuItem.Separator key={`${String(ii)}-hr`} />);
      }
    });
    return <CustomMenu>{children}</CustomMenu>;
  }

  _onUIEnter = (command: UICommand, event: SyntheticEvent): void => {
    if (command.shouldRespondToUIEvent(event)) {
      this._activeCommand && this._activeCommand.cancel();
      this._activeCommand = command;
      this._execute(command, event);
    }
  };

  _execute = (command: UICommand, e: SyntheticEvent) => {
    const { dispatch, editorState, editorView, onCommand } = this.props;
    if (command.execute(editorState, dispatch, editorView, e)) {
      onCommand && onCommand();
    }
  };
}

export default CommandMenu;
