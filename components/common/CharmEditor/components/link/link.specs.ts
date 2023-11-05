import { link } from '@bangle.dev/base-components';

import type { BaseRawMarkSpec } from 'components/common/CharmEditor/components/@bangle.dev/core/specRegistry';

export function spec() {
  const linkSpec = link.spec({
    openOnClick: false
  }) as BaseRawMarkSpec;

  linkSpec.schema.toDOM = (node) => {
    return [
      'a',
      {
        ...node.attrs,
        rel: 'noopener noreferrer nofollow',
        class: 'charm-link',
        target: '_blank'
      }
    ];
  };
  return linkSpec;
}
