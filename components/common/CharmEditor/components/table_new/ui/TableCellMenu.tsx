import { Edit as EditIcon } from '@mui/icons-material';
import type { EditorState } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import CommandMenuButton from './CommandMenuButton';
import { TABLE_COMMANDS_GROUP } from './EditorToolbarConfig';

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
      icon={<EditIcon fontSize='small' sx={{ pointerEvents: 'none' }} />}
      title='Edit'
    />
  );
}
