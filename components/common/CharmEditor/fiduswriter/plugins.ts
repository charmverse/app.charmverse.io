import { Plugin } from '@bangle.dev/pm';
import type { EditorState } from '@bangle.dev/pm';
import { trackPlugin } from './statePlugins/track';

export function plugins ({ onSelectionSet, userId, username }: { onSelectionSet?: (state: EditorState) => void, userId: string, username: string }) {
  return [
    trackPlugin({ userId, username }),
    // this plugin emits the changes/new state from the origianl trackPlugin, which allows the sidebar to update
    new Plugin({
      state: {
        init () {
          return false;
        },
        apply (tr, prev, oldState, state) {
          // react to when something is clicked
          if (tr.selectionSet && onSelectionSet) {
            onSelectionSet(state);
          }
          return prev;
        }
      }
    })
  ];
}
