import type { NodeType, Builder } from 'lib/prosemirror/builders';
import { builders as _, jsonDoc } from 'lib/prosemirror/builders';

import { countBlocks } from '../countBlocks';

describe('countBlocks()', () => {
  it('Should return 0 for an empty doc', () => {
    const doc = jsonDoc();
    const result = countBlocks(doc);
    expect(result).toBe(0);
  });

  it('Should not fail, and instead return 0 for an invalid doc', () => {
    const result = countBlocks('foobar');
    expect(result).toBe(0);
  });

  it('Should count multiple nodes in one document', () => {
    const nodes = [_.heading('some'), _.blockquote(_.p('some')), _.p(_.hardBreak()), _.img()];
    const doc = jsonDoc(...nodes);
    const result = countBlocks(doc);
    expect(result).toBe(5);
  });
});

describe('countBlocks() - all nodes', () => {
  const expectedCounts = {
    blockquote: 1,
    bold: 0,
    bookmark: 1,
    bullet_list: 0,
    bulletList: 0,
    button: 1,
    checkbox: 1,
    code: 0,
    codeBlock: 1,
    columnLayout: 1,
    columnBlock: 0,
    cryptoPrice: 1,
    date: 0,
    farcasterFrame: 1,
    deletion: 0,
    disclosure: 0,
    disclosureDetails: 1,
    disclosureSummary: 0,
    doc: 0,
    emoji: 0,
    emojiSuggest: 0,
    file: 1,
    format_change: 0,
    hardBreak: 0,
    heading: 1,
    horizontalRule: 1,
    iframe: 1,
    image: 1,
    in: 0,
    'inline-comment': 0,
    'inline-vote': 0,
    'inline-command-palette-pale': 0,
    'inline-command-palette-paletteMark': 0,
    inlineDatabase: 1,
    insertion: 0,
    italic: 0,
    label: 0,
    link: 0,
    list_item: 1,
    listItem: 1,
    mention: 0,
    mentionSuggest: 0,
    nestedPageSuggest: 0,
    nft: 1,
    ordered_list: 0,
    orderedList: 0,
    page: 1,
    linkedPage: 1,
    paragraph: 1,
    pdf: 1,
    poll: 1,
    quote: 1,
    strike: 0,
    tabIndent: 0,
    table: 1,
    table_row: 1,
    table_cell: 0,
    table_header: 0,
    tableOfContents: 1,
    'text-color': 0,
    tooltip: 0,
    'tooltip-marker': 0,
    tweet: 1,
    video: 1,
    underline: 0
  };

  const testedNodeTypes = Object.keys(_.schema.nodes)
    .filter(
      (nodeType) =>
        nodeType !== 'doc' &&
        // the builder for "text" type does not work
        nodeType !== 'text'
    )
    .map((nodeType) => [nodeType, _[nodeType as NodeType]] as [NodeType, Builder]);

  test.each(testedNodeTypes)('returns the correct result for node type: %s', (nodeType, builder) => {
    const result = countBlocks(jsonDoc(builder()));
    expect(result).toBe(expectedCounts[nodeType as keyof typeof expectedCounts]);
  });
});
