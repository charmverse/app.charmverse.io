import { NodeView, type BaseRawNodeSpec, type RawPlugins } from '@bangle.dev/core';

import { spec as quoteSpec } from '../quote';

const name = 'blockquote';

const defaultIcon = '😃';

export function spec (): BaseRawNodeSpec {
  const _spec = quoteSpec();
  _spec.name = 'blockquote';
  _spec.schema.attrs = {
    emoji: { default: defaultIcon },
    track: { default: [] }
  };
  if (_spec.markdown?.parseMarkdown) {
    _spec.markdown.parseMarkdown.blockquote.block = name;
  }
  return _spec;
}

export function plugins (): RawPlugins {
  return [
    NodeView.createPlugin({
      name: 'blockquote',
      containerDOM: ['blockquote'],
      contentDOM: ['div']
    })
  ];
}
