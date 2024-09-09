import { NodeView } from '../@bangle.dev/core/node-view';

import { name } from './config';

export function plugins() {
  return [
    NodeView.createPlugin({
      name,
      containerDOM: ['div']
    })
  ];
}
