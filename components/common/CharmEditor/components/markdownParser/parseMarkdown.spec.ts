import { singularity } from './files';
import { parseMarkdown } from './parseMarkdown';

describe('parseMarkdown', () => {
  it('should parse markdown into prosemirror nodes', async () => {
    // console.log('Markdown', markdown);

    const parsedNodes = parseMarkdown(singularity);
    // console.log('Parsed nodes', parsedNodes);
  });
});
