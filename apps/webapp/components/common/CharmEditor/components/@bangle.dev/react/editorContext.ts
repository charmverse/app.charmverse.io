import type { EditorView } from 'prosemirror-view';
import React from 'react';

export const EditorViewContext = React.createContext<EditorView | null>(null);
