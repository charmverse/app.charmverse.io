import { NodeView } from '@bangle.dev/core';

import { name } from './config';

export function plugins() {
  return [
    NodeView.createPlugin({
      name,
      containerDOM: ['poll']
    })
  ];
}
