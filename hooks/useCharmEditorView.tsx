import type { EditorView } from 'prosemirror-view';
import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

// context to allow accessing the editor view from outside the charm editor component
type IContext = {
  view: EditorView | null;
  setView: (view: EditorView | null) => void;
};

export const CharmEditorViewContext = createContext<IContext | null>(null);

export function CharmEditorViewProvider({ children }: { children: ReactNode }) {
  const view = useRef<EditorView | null>(null);

  // keep track of a counter so we can trigger re-render in React
  const [counter, setCounter] = useState(0);

  const setView = useCallback(
    function setView(newView: EditorView | null) {
      view.current = newView;
      setCounter((prev) => prev + 1);
    },
    [setCounter]
  );

  const value: IContext = useMemo(
    () => ({
      view: view.current,
      setView
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [counter, view, setView]
  );

  return <CharmEditorViewContext.Provider value={value}>{children}</CharmEditorViewContext.Provider>;
}

export const useCharmEditorView = () => {
  const context = useContext(CharmEditorViewContext);
  if (!context) {
    throw new Error('useCharmEditorView must be used within a CharmEditorViewProvider');
  }
  return context;
};
