import { NodeView } from '../@bangle.dev/core/node-view';

import { name } from './pollSpec';

export function plugins() {
  return [
    NodeView.createPlugin({
      name,
      containerDOM: ['poll']
    })
  ];
}
