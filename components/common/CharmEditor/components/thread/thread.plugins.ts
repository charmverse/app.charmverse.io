import type { EditorState, Node } from '@bangle.dev/pm';
import type { PluginKey } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { markName as inlineCommentMarkName } from '../inlineComment';

export interface ThreadPluginState {
  threadIds: string[];
}

export const plugins = ({ key, threadIds = [] }: { threadIds?: string[]; key: PluginKey }) => {
  return [
    new Plugin({
      key,
      state: {
        init: () => {
          return threadIds;
        },
        apply: (tr, pluginState) => {
          const newPluginState = tr.getMeta(key);
          if (newPluginState) {
            return newPluginState;
          }
          return pluginState;
        }
      },
      props: {
        decorations(state: EditorState) {
          return buildInlineCommentDecoration(state, (this.getState(state) as string[]) ?? []);
        }
      }
    })
  ];
};

export function buildInlineCommentDecoration(state: EditorState, threadIds: string[]) {
  const doc = state.doc;
  const decorations: Decoration[] = [];
  doc.descendants((node: Node, pos: number) => {
    if (node.marks.some((mark) => mark.type.name === inlineCommentMarkName && threadIds.includes(mark.attrs.id))) {
      decorations.push(
        Decoration.inline(
          pos,
          pos + node.nodeSize,
          { nodeName: 'span', class: 'active' },
          {
            inclusiveStart: true,
            inclusiveEnd: true
          }
        )
      );
    }
  });
  return DecorationSet.create(doc, decorations);
}
