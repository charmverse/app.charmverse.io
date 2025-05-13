import { name } from '@packages/bangleeditor/components/poll/pollSpec';

import { NodeView } from '../@bangle.dev/core/node-view';

export function plugins() {
  return [
    NodeView.createPlugin({
      name,
      containerDOM: ['poll']
    })
  ];
}
