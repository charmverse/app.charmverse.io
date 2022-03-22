import { PaymentMethod } from '@prisma/client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import charmClient from 'charmClient';
import { BangleEditorState } from '@bangle.dev/core';
import { EditorView } from '@bangle.dev/pm';
import { useCurrentSpace } from './useCurrentSpace';

type IContext = [
  editorView: EditorView | null,
  setEditorView: Dispatch<SetStateAction<EditorView | null>>,
]

export const EditorViewContext = createContext<Readonly<IContext>>([
  null,
  () => undefined
]);

export function EditorViewProvider ({ children }: { children: ReactNode }) {

  const [editorView, setEditorView] = useState<EditorView | null>(null);

  const value = useMemo(() => {
    return [editorView, setEditorView] as const;
  }, [editorView]);

  return (
    <EditorViewContext.Provider value={value}>
      {children}
    </EditorViewContext.Provider>
  );
}

export const useCurrentEditorView = () => useContext(EditorViewContext);
