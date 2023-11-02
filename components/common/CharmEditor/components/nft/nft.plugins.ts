import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';

import { name } from './config';

export function plugins() {
  return [
    NodeView.createPlugin({
      name,
      containerDOM: ['div']
    })
  ];
}
