// @flow
import { Edit as EditIcon } from '@mui/icons-material';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';
import React from 'react';

import CommandMenuButton from './CommandMenuButton';
import { TABLE_COMMANDS_GROUP } from './EditorToolbarConfig';

import './czi-table-cell-menu.css';

type Props = {
  editorState: EditorState;
  editorView: EditorView;
};

class TableCellMenu extends React.PureComponent<Props> {
  _menu = null;

  render(): React.ReactNode {
    const { editorState, editorView } = this.props;
    return (
      <CommandMenuButton
        className='czi-table-cell-menu'
        commandGroups={TABLE_COMMANDS_GROUP}
        dispatch={editorView.dispatch}
        editorState={editorState}
        editorView={editorView}
        icon={<EditIcon />}
        title='Edit'
      />
    );
  }
}

export default TableCellMenu;
