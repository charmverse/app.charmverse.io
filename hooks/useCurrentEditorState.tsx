import { PaymentMethod } from '@prisma/client';
import { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useMemo, useState } from 'react';
import charmClient from 'charmClient';
import { BangleEditorState } from '@bangle.dev/core';
import { useCurrentSpace } from './useCurrentSpace';

type IContext = [
  editorState: BangleEditorState<any> | null,
  setEditorState: Dispatch<SetStateAction<BangleEditorState<any> | null>>,
]

export const EditorStateContext = createContext<Readonly<IContext>>([
  null,
  () => undefined
]);

export function EditorStateProvider ({ children }: { children: ReactNode }) {

  const [editorState, setEditorState] = useState<BangleEditorState<any> | null>(null);

  const value = useMemo(() => {
    return [editorState, setEditorState] as const;
  }, [editorState]);

  return (
    <EditorStateContext.Provider value={value}>
      {children}
    </EditorStateContext.Provider>
  );
}

export const useCurrentEditorState = () => useContext(EditorStateContext);
