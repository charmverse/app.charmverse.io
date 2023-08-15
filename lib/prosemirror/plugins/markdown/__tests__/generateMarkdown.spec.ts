import { generateMarkdown } from '../generateMarkdown';

describe('generateMarkdown', () => {
  it('should generate markdown from a header', async () => {
    const h1Data = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1, collapseContent: null },
          content: [{ text: 'Description', type: 'text' }]
        }
      ]
    };

    const exportedH1 = await generateMarkdown({ content: h1Data });

    expect(exportedH1).toEqual(`# Description`);

    const h2Data = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 2, collapseContent: null },
          content: [{ text: 'Description', type: 'text' }]
        }
      ]
    };

    const exportedH2 = await generateMarkdown({ content: h2Data });

    expect(exportedH2).toEqual(`## Description`);

    const h3Data = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 3, collapseContent: null },
          content: [{ text: 'Description', type: 'text' }]
        }
      ]
    };

    const exportedH3 = await generateMarkdown({ content: h3Data });

    expect(exportedH3).toEqual(`### Description`);
  });

  it('should handle text and ignore the emojiSuggest mark', async () => {
    const inputData = {
      type: 'doc',
      content: [
        {
          text: ':',
          type: 'text',
          marks: [{ type: 'emojiSuggest', attrs: { trigger: ':' } }]
        }
      ]
    };
    const exported = await generateMarkdown({ content: inputData });

    expect(exported).toEqual(`:`);
  });
  it('should generate handle a bullet list', async () => {
    const inputData = {
      type: 'doc',
      content: [
        {
          type: 'bulletList',
          attrs: { tight: false },
          content: [
            {
              type: 'listItem',
              attrs: { track: [], todoChecked: null },
              content: [
                {
                  type: 'paragraph',
                  attrs: { track: [] },
                  content: [{ text: 'First list item', type: 'text' }]
                }
              ]
            },
            {
              type: 'listItem',
              attrs: { track: [], todoChecked: null },
              content: [
                {
                  type: 'paragraph',
                  attrs: { track: [] },
                  content: [
                    { text: 'Second list item part 1', type: 'text' },
                    { text: 'Second list item part 2', type: 'text' }
                  ]
                },
                {
                  type: 'bulletList',
                  attrs: { tight: false },
                  content: [
                    {
                      type: 'listItem',
                      attrs: { track: [], todoChecked: null },
                      content: [
                        {
                          type: 'paragraph',
                          attrs: { track: [] },
                          content: [
                            {
                              text: 'First nested bullet list item',
                              type: 'text'
                            }
                          ]
                        }
                      ]
                    },
                    {
                      type: 'listItem',
                      attrs: { track: [], todoChecked: null },
                      content: [
                        {
                          type: 'paragraph',
                          attrs: { track: [] },
                          content: [
                            {
                              type: 'text',
                              text: 'Second nested bullet list item'
                            }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };
    const exported = await generateMarkdown({ content: inputData });

    expect(exported).toEqual(
      // eslint-disable-next-line prettier/prettier
`- First list item

- Second list item part 1Second list item part 2

  - First nested bullet list item

  - Second nested bullet list item`
    );
  });
});
