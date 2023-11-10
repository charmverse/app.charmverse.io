import type { EditorState, Node } from '@bangle.dev/pm';
import type { PluginKey } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { markName as inlineCommentMarkName } from '../inlineComment';

export interface ThreadPluginState {
  threadIds: string[];
}

export const plugins = ({ key }: { key: PluginKey }) => {
  return [
    new Plugin({
      key,
      state: {
        init: () => {
          return [];
        },
        apply: (tr) => {
          return tr.getMeta(key);
        }
      },
      props: {
        decorations(state: EditorState) {
          const threadIds = this.getState(state) as string[];
          return buildInlineCommentDecoration(state, threadIds ?? []);
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
