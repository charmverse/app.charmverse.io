import type Token from 'markdown-it/lib/token';
import type { DOMOutputSpec, Mark, Node } from 'prosemirror-model';

import type { BaseRawMarkSpec } from '../../buildSchema';

export function spec(): BaseRawMarkSpec {
  return {
    type: 'mark',
    name: 'link',
    schema: {
      attrs: {
        href: {
          default: null
        }
      },
      inclusive: false,
      parseDOM: [
        {
          tag: 'a[href]',
          getAttrs: (dom: any) => ({
            href: dom.getAttribute('href')
          })
        }
      ],
      toDOM: (node): DOMOutputSpec => [
        'a',
        {
          ...node.attrs,
          rel: 'noopener noreferrer nofollow',
          class: 'charm-link',
          target: '_blank'
        }
      ]
    },
    markdown: {
      toMarkdown: {
        open(_state, mark, parent, index) {
          return isPlainURL(mark, parent, index, 1) ? '<' : '[';
        },
        close(state, mark, parent, index) {
          return isPlainURL(mark, parent, index, -1)
            ? '>'
            : `](${state.esc(mark.attrs.href)}${mark.attrs.title ? ` ${quote(mark.attrs.title)}` : ''})`;
        }
      },
      parseMarkdown: {
        link: {
          mark: 'link',
          getAttrs: (tok: Token) => ({
            href: tok.attrGet('href'),
            title: tok.attrGet('title') || null
          })
        }
      }
    },
    options: {
      openOnClick: false
    }
  };
}

function isPlainURL(link: Mark, parent: Node, index: number, side: number) {
  if (link.attrs.title || !/^\w+:/.test(link.attrs.href)) {
    return false;
  }
  const content = parent.child(index + (side < 0 ? -1 : 0));
  if (!content.isText || content.text !== link.attrs.href || content.marks[content.marks.length - 1] !== link) {
    return false;
  }
  if (index === (side < 0 ? 1 : parent.childCount - 1)) {
    return true;
  }
  const next = parent.child(index + (side < 0 ? -2 : 1));
  return !link.isInSet(next.marks);
}

// From Prosemirror https://github.com/prosemirror/prosemirror-markdown/blob/6107527995873d6199bc533a753b614378747056/src/to_markdown.ts#L380

// Tries to wrap the string with `"` , if not `''` else `()`
function quote(str: string) {
  const wrap = str.indexOf('"') === -1 ? '""' : str.indexOf("'") === -1 ? "''" : '()';
  return wrap[0] + str + wrap[1];
}
