import markdownit from 'markdown-it';
import { DOMParser, Fragment, Slice } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';
import type { EditorView } from 'prosemirror-view';

import { insertNode } from 'components/common/CharmEditor/utils';
import { charmParser } from 'lib/prosemirror/markdown/parseMarkdown';

const md = markdownit({
  html: true,
  linkify: true,
  breaks: true,
  typographer: true
});

export function plugins() {
  let shiftKey = false;

  return [
    // Parse markdown unless Mod+Shift+V is pressed for text clipboard content
    new Plugin({
      props: {
        handleDOMEvents: {
          mouseup(_, event) {
            shiftKey = event.shiftKey;
            return false;
          }
        },
        handleKeyDown(_, event) {
          shiftKey = event.shiftKey;
          return false;
        },
        // handle copy+paste from most applications, where the clipboard content is plain text
        clipboardTextParser(str, $context, plain, view) {
          const parser = DOMParser.fromSchema(view.state.schema);
          const doc = document.cloneNode(false) as Document;
          const dom = doc.createElement('div');
          if (shiftKey) {
            // Treat single newlines as linebreaks and double newlines as paragraph breaks when pasting as plaintext
            dom.innerHTML = `<p>${str.replaceAll('\n', '<br />').replaceAll('<br /><br />', '</p><p>')}</p>`;
          } else {
            dom.innerHTML = md.render(str);
          }
          return parser.parseSlice(dom, { preserveWhitespace: true, context: $context });
        },
        // handle paste from VS Code, which does not trigger clipboardTextParser for some reason
        handlePaste: (view: EditorView, rawEvent: ClipboardEvent) => {
          const event = rawEvent;
          if (!event.clipboardData) {
            return false;
          }
          const html = event.clipboardData.getData('text/html');
          const isCopiedFromProsemirror = html.includes('data-pm-slice');
          if (isCopiedFromProsemirror) {
            // prosemirror has its own way of handling content copied from itself
            return false;
          }
          const text = event.clipboardData.getData('text/plain');
          const node = charmParser.parse(text);
          if (node) {
            // create a slice from the child nodes, instead of inserting the node, which has type === 'doc' which causes extra new lines
            const slice = new Slice(Fragment.from(node.content), 0, 0);
            view.dispatch(
              view.state.tr.replaceSelection(slice).scrollIntoView().setMeta('paste', true).setMeta('uiEvent', 'paste')
            );
            return true;
          }
          return false;
        }
      }
    })
  ];
}
