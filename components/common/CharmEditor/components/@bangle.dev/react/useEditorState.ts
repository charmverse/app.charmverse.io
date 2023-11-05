import { useState } from 'react';

import type { BangleEditorStateProps } from '../core/bangle-editor-state';
import { BangleEditorState } from '../core/bangle-editor-state';

export function useEditorState(props: BangleEditorStateProps) {
  if (props.plugins && typeof props.plugins !== 'function') {
    throw new Error('plugins error: plugins must be a function');
  }
  const [state] = useState(
    () =>
      // Instantiate the editorState once and keep using that instance
      // on subsequent renders.
      // Passing a callback in useState lazy calls the
      // functions on the first render and never again.
      new BangleEditorState(props)
  );
  return state;
}
