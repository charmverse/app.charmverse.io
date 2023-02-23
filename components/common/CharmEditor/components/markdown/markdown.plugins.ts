import markdownit from 'markdown-it';
import { DOMParser } from 'prosemirror-model';
import { Plugin } from 'prosemirror-state';

const md = markdownit({
  html: false,
  linkify: true,
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
        }
      }
    })
  ];
}
