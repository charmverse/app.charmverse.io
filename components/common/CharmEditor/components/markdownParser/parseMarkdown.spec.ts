import { markdownContent } from './firstTestNote';
import { parseMarkdown, parseMarkdownStub } from './parseMarkdown';

describe('parseMarkdown', () => {
  it('should parse markdown into prosemirror nodes', async () => {
    // console.log('Markdown', markdown);

    const parsedNodes = parseMarkdown(markdownContent);
    // console.log('Parsed nodes', parsedNodes);
  });
  it('should parse markdown into prosemirror nodes', async () => {
    // console.log('Markdown', markdown);

    const parsedNodes = parseMarkdownStub();
    // console.log('Parsed nodes', parsedNodes);
  });
});
