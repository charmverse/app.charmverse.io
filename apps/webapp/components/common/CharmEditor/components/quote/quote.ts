import { getNodeType } from '@bangle.dev/utils';
import { wrappingInputRule } from 'prosemirror-inputrules';
import type { MarkdownSerializerState } from 'prosemirror-markdown';
import type { DOMOutputSpec, Node } from 'prosemirror-model';

import type { RawPlugins } from '../@bangle.dev/core/plugin-loader';

const name = 'quote';

export function plugins(): RawPlugins {
  return ({ schema }) => {
    const type = getNodeType(schema, name);
    return [wrappingInputRule(/^\s*>\s$/, type)];
  };
}
