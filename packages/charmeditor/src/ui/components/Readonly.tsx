import { useEditorEventCallback } from '@nytimes/react-prosemirror';
import { useEffect } from 'react';
import type { ReactNode } from 'react';

// a component that can be used to toggle the editor to readonly mode
export function Readonly({ children, readOnly }: { children: ReactNode; readOnly?: boolean }) {
  const toggleReadonly = useEditorEventCallback((view, _readOnly?: boolean) => {
    view.setProps({ editable: () => !_readOnly });
  });
  useEffect(() => toggleReadonly(readOnly), [toggleReadonly, readOnly]);
  return children;
}
