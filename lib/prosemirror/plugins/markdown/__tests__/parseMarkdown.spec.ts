import { parseMarkdown } from '../parseMarkdown';

describe('parseMarkdown()', () => {
  it('Should return a simple sentence', () => {
    const result = parseMarkdown('Markdown title content');
    expect(result).toEqual({
      content: [
        { attrs: { track: [] }, content: [{ text: 'Markdown title content', type: 'text' }], type: 'paragraph' }
      ],
      type: 'doc'
    });
  });
});
