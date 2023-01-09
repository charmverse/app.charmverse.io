import { NodeView } from '@bangle.dev/core';

export function plugins() {
  return NodeView.createPlugin({
    name: 'bookmark',
    containerDOM: ['div', { draggable: 'false' }]
  });
}
