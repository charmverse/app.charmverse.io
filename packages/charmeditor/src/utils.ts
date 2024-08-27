import type { EditorState } from 'prosemirror-state';

import { GapCursorSelection } from './helpers';

/**
 * Creates an object from an array of [key, Value], filtering out any
 * undefined or null key
 */
export function createObject<T>(entries: [string | null | undefined, T][]): {
  [k: string]: T;
} {
  return Object.fromEntries(entries.filter((e) => e[0] != null));
}

export function isAtBeginningOfLine(state: EditorState) {
  const { empty, $from } = state.selection;
  return empty && ($from.parentOffset === 0 || state.selection instanceof GapCursorSelection);
}
