import { extractSummary } from '../extractSummary';
import type { PageContent } from '../interfaces';

describe('extractSummary()', () => {
  it('Should extract first few text blocks', () => {
    const doc: PageContent = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, collapseContent: null },
          content: [
            { text: 'Heading ', type: 'text' },
            {
              type: 'mention',
              attrs: {
                id: 'd3067f54-0a1c-439a-8317-694056cc25bc',
                type: 'user',
                value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
                createdAt: '2022-06-15T15:38:53.905Z',
                createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f'
              }
            },
            { text: ' mentions', type: 'text' }
          ]
        },
        { type: 'paragraph' },
        { type: 'paragraph', content: [{ text: 'Some paragraph text', type: 'text' }] }
      ]
    };
    const result = extractSummary(doc);
    expect(result).toEqual('');
  });

  it('Should extract the first image', () => {
    const doc: PageContent = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            alt: null,
            src: 'https://google.com/image.png',
            size: 700,
            track: [],
            caption: null
          }
        }
      ]
    };
    const result = extractSummary(doc);
    expect(result).toEqual('');
  });
});
