import { NodeView } from '@bangle.dev/core';

import { name } from './pollSpec';

export function plugins() {
  return [
    NodeView.createPlugin({
      name,
      containerDOM: ['poll']
    })
  ];
}
