import markdownit from 'markdown-it/lib';
import { MarkdownParser } from 'prosemirror-markdown';

import { listIsTight } from 'components/common/CharmEditor/components/listItem/listIsTight';
import { specRegistry } from 'components/common/CharmEditor/specRegistry';
import type { PageContent } from 'lib/prosemirror/interfaces';

const charmParser = new MarkdownParser(specRegistry.schema, markdownit('commonmark', { html: false }), {
  blockquote: { block: 'blockquote' },
  paragraph: { block: 'paragraph' },
  list_item: { block: 'listItem', node: 'listItem' },
  bullet_list: { block: 'bulletList', getAttrs: (_, tokens, i) => ({ tight: listIsTight(tokens, i) }) },
  ordered_list: {
    block: 'orderedList',
    getAttrs: (tok, tokens, i) => ({
      order: +tok.attrGet('start') || 1,
      tight: listIsTight(tokens, i)
    })
  },
  heading: { block: 'heading', getAttrs: (tok) => ({ level: +tok.tag.slice(1) }) },
  code_block: { block: 'codeBlock', noCloseToken: true },
  fence: { block: 'codeBlock', getAttrs: (tok) => ({ params: tok.info || '' }), noCloseToken: true },
  hr: { node: 'horizontalRule' },
  image: {
    node: 'image',
    getAttrs: (tok) => ({
      src: tok.attrGet('src'),
      title: tok.attrGet('title') || null,
      alt: (tok.children[0] && tok.children[0].content) || null
    })
  },
  hardbreak: { node: 'hardBreak' },
  em: { mark: 'italic' },
  strong: { mark: 'bold' },
  link: {
    mark: 'link',
    getAttrs: (tok) => ({
      href: tok.attrGet('href'),
      title: tok.attrGet('title') || null
    })
  },
  code_inline: { mark: 'code', noCloseToken: true }
});

export function parseMarkdown(data: string): PageContent {
  const baseDoc = { type: 'doc', content: [] };

  const parsed = (charmParser.parse(data)?.content as any)?.content;

  if (parsed) {
    baseDoc.content = parsed;
  }

  return baseDoc;
}
