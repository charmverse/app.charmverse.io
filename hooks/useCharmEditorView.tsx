import type { EditorView } from 'prosemirror-view';
import { createContext, useContext, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';

// context to allow accessing the editor view from outside the charm editor component
type IContext = {
  view: EditorView | null;
  setView: Dispatch<SetStateAction<EditorView | null>>;
};

export const CharmEditorViewContext = createContext<IContext | null>(null);

export function CharmEditorViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<EditorView | null>(null);

  const value: IContext = useMemo(
    () => ({
      view,
      setView
    }),
    [view, setView]
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
