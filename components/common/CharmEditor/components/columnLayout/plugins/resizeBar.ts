import { getNodeType } from '@bangle.dev/utils';
import type { EditorState } from 'prosemirror-state';
import { Plugin } from 'prosemirror-state';
import { findChildrenByType } from 'prosemirror-utils';
import { Decoration, DecorationSet } from 'prosemirror-view';

import { createElement } from 'components/common/CharmEditor/components/@bangle.dev/core/createElement';

const barWidth = 50;

// Add a decoration next to each column block
export function ResizeBarDecoration() {
  return new Plugin({
    state: {
      init(_, state) {
        return buildResizeBars(state);
      },
      apply(tr, old, oldState, newState) {
        // For performance only build the
        // decorations if the doc has actually changed
        return tr.docChanged ? buildResizeBars(newState) : old;
      }
    },
    props: {
      decorations(state: EditorState) {
        return this.getState(state);
      }
    }
  });
}

// Find all column rows, and then add a decoration next to each child column except for the first one
function buildResizeBars(state: EditorState) {
  const nodeType = getNodeType(state, 'columnLayout');
  const rowNodes = findChildrenByType(state.doc, nodeType);
  const resizeBarConfig = rowNodes
    .map((row) => {
      // Remove the first column since it does not need a resize bar
      const [, ...columns] = findChildrenByType(row.node, getNodeType(state, 'columnBlock'));
      return columns.map((column) => ({ pos: column.pos + row.pos }));
    })
    .flat();

  // See https://prosemirror.net/docs/ref/#view.Decoration^widget
  return DecorationSet.create(
    state.doc,
    resizeBarConfig.map(({ pos }) =>
      Decoration.widget(
        pos + 1,
        () => {
          return createElement([
            'div',
            { class: 'charm-column-resizer', 'data-item-type': 'BAR', 'data-item-config': `{"size": ${barWidth}}` },
            ['div', ['div']]
          ]);
        },
        {
          // helps rowAction plugin ignore widgets when using posAtDom
          side: -1
        }
      )
    )
  );
}
