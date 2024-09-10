import indentStyles from '../extensions/listItem/czi-indent.module.scss';
import listStyles from '../extensions/listItem/czi-list.module.scss';
import varsStyles from '../extensions/listItem/czi-vars.module.scss';

import editorStyles from './editor.module.scss';
import pmStyles from './prosemirror.module.scss';

export const className = [
  editorStyles.ProseMirror,
  pmStyles.ProseMirror,
  listStyles.ProseMirror,
  indentStyles.ProseMirror,
  varsStyles.ProseMirror
].join(' ');
