import { link } from '@bangle.dev/base-components';
import type { BaseRawMarkSpec } from '@bangle.dev/core';

export function spec() {
  const linkSpec = link.spec({
    openOnClick: true
  }) as BaseRawMarkSpec;

  linkSpec.schema.toDOM = (node) => {
    return [
      'a',
      {
        ...node.attrs,
        rel: 'noopener noreferrer nofollow',
        class: 'charm-link'
      }
    ];
  };
  return linkSpec;
}
