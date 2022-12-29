import type { Page } from '@prisma/client';
import markdownit from 'markdown-it/lib';
import { MarkdownParser } from 'prosemirror-markdown';

import { specRegistry } from '../../specRegistry';
import { listIsTight } from '../listItem/listIsTight';

// eslint-disable-next-line import/order
import { markdownContent } from './firstTestNote';

// eslint-disable-next-line import/no-webpack-loader-syntax

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

export function parseMarkdown(data: string): any {
  const baseDoc = { type: 'doc', content: [] };

  const parsed = (charmParser.parse(data)?.content as any)?.content;

  if (parsed) {
    baseDoc.content = parsed;
  }

  return baseDoc;
}

// Test function for now

// Utility function to parse example markdown into prosemirror nodes
export async function parseMarkdownStub(): Promise<Pick<Page, 'content'>> {
  // const basicMarkdown = `# This is a test`;

  const parsedNodes = parseMarkdown(markdownContent);
  return parsedNodes;
}
