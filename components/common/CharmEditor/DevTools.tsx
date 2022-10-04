
import { useEditorViewContext } from '@bangle.dev/react';
import { applyDevTools } from 'prosemirror-dev-tools';
import { useEffect } from 'react';

// A React componenet that loads the prosemirror dev tools

export default function RegisterDevTools () {
  const view = useEditorViewContext();
  useEffect(() => {
    if (view && process.env.NODE_ENV === 'development') {
      applyDevTools(view);
    }
  }, [view]);
  return null;
}
