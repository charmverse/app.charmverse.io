import { RawSpecs } from '@bangle.dev/core';
import { Schema, DOMOutputSpec, Command, toggleMark, EditorState } from '@bangle.dev/pm';
import { isMarkActiveInSelection } from '@bangle.dev/utils';

const name = 'highlight';

const getTypeFromSchema = (schema: Schema) => schema.marks[name];

export function highlightSpec (): RawSpecs {
  return {
    type: 'mark',
    name,
    schema: {
      parseDOM: [
        {
          tag: 'span.charm-inline-comment'
        }
      ],
      toDOM: (): DOMOutputSpec => ['span', { class: 'charm-inline-comment' }]
    },
    markdown: {
      // TODO: Fix convert to markdown
      toMarkdown: {
        open: '**',
        close: '**',
        mixable: true,
        expelEnclosingWhitespace: true
      },
      parseMarkdown: {
        strong: { mark: name }
      }
    }
  };
}

export function toggleHighlight (): Command {
  return (state, dispatch) => {
    return toggleMark(getTypeFromSchema(state.schema))(state, dispatch);
  };
}

export function queryIsHighlightActive () {
  return (state: EditorState) => isMarkActiveInSelection(getTypeFromSchema(state.schema))(state);
}
