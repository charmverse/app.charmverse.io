
import applyDevTools from 'prosemirror-dev-tools';
import { useEditorViewContext } from '@bangle.dev/react';

// A React componenet that loads the prosemirror dev tools

export default function RegisterDevTools () {
  if (process.env.NODE_ENV === 'development') {
    const view = useEditorViewContext();
    if (view) {
      applyDevTools(view);
    }
  }
  return null;
}
