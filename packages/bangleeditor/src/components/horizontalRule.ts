import { safeInsert } from '@bangle.dev/utils';
import { InputRule } from 'prosemirror-inputrules';
import type { DOMOutputSpec, Schema } from 'prosemirror-model';

import type { RawPlugins } from './@bangle.dev/core/plugin-loader';
import type { RawSpecs } from './@bangle.dev/core/specRegistry';

export const spec = specFactory;
export const plugins = pluginsFactory;

const name = 'horizontalRule';

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function specFactory(): RawSpecs {
  return {
    type: 'node',
    name,
    schema: {
      attrs: {
        track: {
          default: []
        }
      },
      group: 'block',
      parseDOM: [{ tag: 'hr' }],
      toDOM: (): DOMOutputSpec => ['hr']
    },
    markdown: {
      toMarkdown(state, node) {
        state.write(node.attrs.markup || '---');
        state.closeBlock(node);
      },
      parseMarkdown: { hr: { node: name } }
    }
  };
}

function pluginsFactory({ markdownShortcut = true } = {}): RawPlugins {
  return ({ schema }) => {
    const type = getTypeFromSchema(schema);

    return [
      markdownShortcut &&
        new InputRule(/^(?:---|___\s|\*\*\*\s)$/, (state, match, start, end) => {
          if (!match[0]) {
            return null;
          }
          const tr = state.tr.replaceWith(start - 1, end, type.createChecked());
          // Find the paragraph that contains the "---" shortcut text, we need
          // it below for deciding whether to insert a new paragraph after the
          // hr.
          const $para = state.doc.resolve(start);

          let insertParaAfter = false;
          if ($para.end() !== end) {
            // if the paragraph has more characters, e.g. "---abc", then no
            // need to insert a new paragraph
            insertParaAfter = false;
          } else if ($para.after() === $para.end(-1)) {
            // if the paragraph is the last child of its parent, then insert a
            // new paragraph
            insertParaAfter = true;
          } else {
            const nextNode = state.doc.resolve($para.after()).nodeAfter!;
            // if the next node is a hr, then insert a new paragraph
            insertParaAfter = nextNode.type === type;
          }
          return insertParaAfter
            ? safeInsert(state.schema.nodes.paragraph.createChecked(), tr.mapping.map($para.after()))(tr)
            : tr;
        })
    ];
  };
}
