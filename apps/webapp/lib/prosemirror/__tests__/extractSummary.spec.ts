import { builders } from '@packages/bangleeditor/builders';

import { extractSummary } from '../extractSummary';

const { doc, p, heading, img } = builders;

describe('extractSummary()', () => {
  it('Should extract first few text blocks', () => {
    const contents = [heading('Every'), p('good'), p('boy'), p('does'), p('fine')];
    const node = doc(...contents).toJSON();
    const result = extractSummary(node as any);
    expect(result).toEqual(doc(...contents.slice(0, 3)).toJSON());
    // expect(result?.content).toHaveLength(3);
  });

  it('Should extract the first image', () => {
    const node = doc(img(), p()).toJSON();
    const result = extractSummary(node);
    expect(result).toEqual(doc(img()).toJSON());
  });

  it('Returns null when content is null', () => {
    const result = extractSummary(null);
    expect(result).toBeNull();
  });

  it('Returns null when document is empty', () => {
    const node = doc().toJSON();
    const result = extractSummary(node);
    expect(result).toBeNull();
  });
});
