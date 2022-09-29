import type { RawSpecs } from '@bangle.dev/core';
import { Plugin } from '@bangle.dev/core';
import type { EditorState, EditorView, Node, Schema, Slice, Transaction } from '@bangle.dev/pm';

import { MAX_EMBED_WIDTH, MIN_EMBED_HEIGHT } from 'lib/embed/constants';
import { extractEmbedLink } from 'lib/embed/extractEmbedLink';

const name = 'iframe';

interface DispatchFn {
  (tr: Transaction): void;
}

// inject a real iframe node when pasting embed codes

export const iframePlugin = new Plugin({
  props: {
    handlePaste: (view: EditorView, rawEvent: ClipboardEvent, slice: Slice) => {
      // @ts-ignore
      const contentRow = slice.content.content?.[0].content.content;
      const embedUrl = extractEmbedLink(contentRow?.[0]?.text);
      if (embedUrl) {
        insertIframeNode(view.state, view.dispatch, view, { src: embedUrl });
        return true;
      }
      return false;
    }
  }
});

const getTypeFromSchema = (schema: Schema) => schema.nodes[name];

function insertIframeNode (state: EditorState, dispatch: DispatchFn, view: EditorView, attrs?: { [key: string]: any }) {
  const type = getTypeFromSchema(state.schema);
  const newTr = type.create(attrs);
  const { tr } = view.state;
  const cursorPosition = state.selection.$head.pos;
  tr.insert(cursorPosition, newTr);
  if (dispatch) {
    dispatch(state.tr.replaceSelectionWith(newTr));
  }
}

export function spec (): RawSpecs {
  return {
    type: 'node',
    name,
    markdown: {
      toMarkdown: (state, node) => {

        // eslint-disable-next-line prefer-const
        let { height, width, src } = node.attrs;

        if (height && width && src) {
          height = parseInt(height);
          width = parseInt(width);

          const attributesToWrite = ` width=${width}px height=${height}px src=${src} `;

          const toRender = `\r\n<iframe ${attributesToWrite}></iframe>\r\n\r\n\r\n`;

          // Ensure markdown html will be separated by newlines
          state.ensureNewLine();
          state.text(toRender);
          state.ensureNewLine();
        }
      }
    },
    schema: {
      attrs: {
        src: {
          default: ''
        },
        width: {
          default: MAX_EMBED_WIDTH
        },
        height: {
          default: MIN_EMBED_HEIGHT
        },
        // Type of iframe, it could either be video or embed
        type: {
          default: 'embed'
        },
        track: {
          default: []
        }
      },
      group: 'block',
      inline: false,
      draggable: false,
      isolating: true, // dont allow backspace to delete
      parseDOM: [
        {
          tag: 'iframe',
          getAttrs: (dom: any) => {
            return {
              src: dom.getAttribute('src')
            };
          }
        }
      ],
      toDOM: (node: Node) => {
        return ['iframe', { class: 'ns-embed', style: `height: ${node.attrs.height};`, ...node.attrs }];
      }
    }
  };
}
