import { NodeView } from '@bangle.dev/core';

export function nestedPagePlugins() {
  return () => {
    return [
      NodeView.createPlugin({
        name: 'page',
        containerDOM: ['div', { class: 'page-container' }]
      })
    ];
  };
}
