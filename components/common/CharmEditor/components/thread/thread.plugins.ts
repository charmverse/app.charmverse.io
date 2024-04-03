import type { Node } from 'prosemirror-model';
import type { EditorState } from 'prosemirror-state';
import { PluginKey, Plugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { markName as inlineCommentMarkName } from '../inlineComment/inlineComment.constants';

export const threadPluginKey = new PluginKey('threads');

export interface ThreadPluginState {
  threadIds: string[];
}

export const plugins = ({ threadIds }: { threadIds: string[] }) => {
  return [
    new Plugin({
      key: threadPluginKey,
      state: {
        init: () => {
          return threadIds;
        },
        apply: (tr, pluginState) => {
          const newPluginState = tr.getMeta(threadPluginKey);
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
          { nodeName: 'span', class: 'active charm-thread-comment' },
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
