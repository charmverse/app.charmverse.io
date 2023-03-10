import { NodeView } from '@bangle.dev/core';

export function plugins() {
  return [
    NodeView.createPlugin({
      name: 'file',
      containerDOM: ['div', { draggable: 'false' }]
    })
  ];
}
