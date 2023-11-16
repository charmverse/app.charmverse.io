import type { EditorView } from 'prosemirror-view';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useContext, useMemo, useState } from 'react';

// keep track of the focused page (may be different from what's in the URL or header)
type ICharmEditorView = {
  view: EditorView | null;
  setView: (view: EditorView) => void;
};

const CharmEditorView = createContext<Readonly<ICharmEditorView>>({
  view: null,
  setView: () => {}
});

export function CharmEditorViewProvider({ children }: { children: ReactNode }) {
  const [view, setView] = useState<EditorView | null>(null);

  const value: ICharmEditorView = useMemo(
    () => ({
      view,
      setView
    }),
    [view, setView]
  );

  return <CharmEditorView.Provider value={value}>{children}</CharmEditorView.Provider>;
}

export const useCharmEditorView = () => useContext(CharmEditorView);
