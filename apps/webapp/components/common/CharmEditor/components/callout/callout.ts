import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { DOMOutputSpec, Node } from 'prosemirror-model';

import { NodeView } from 'components/common/CharmEditor/components/@bangle.dev/core/node-view';
import type { RawPlugins } from 'components/common/CharmEditor/components/@bangle.dev/core/plugin-loader';

export function plugins(): RawPlugins {
  return [
    NodeView.createPlugin({
      name: 'blockquote',
      containerDOM: ['blockquote'],
      contentDOM: ['div']
    })
  ];
}
