import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { baseUrl } from '@packages/config/constants';

import { generateMarkdown } from '../generateMarkdown';

describe('generateMarkdown()', () => {
  it('should generate markdown from a header', async () => {
    const h1Data = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
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
          attrs: { level: 2 },
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
          attrs: { level: 3 },
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
          type: 'bullet_list',
          attrs: { indent: 0 },
          content: [
            {
              type: 'list_item',
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
              type: 'list_item',
              attrs: { track: [], todoChecked: null },
              content: [
                {
                  type: 'paragraph',
                  attrs: { track: [] },
                  content: [
                    { text: 'Second list item part 1', type: 'text' },
                    { text: 'Second list item part 2', type: 'text' }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'bullet_list',
          attrs: { indent: 1 },
          content: [
            {
              type: 'list_item',
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
              type: 'list_item',
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

  it('should convert urls and nested pages to markdown links', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();

    const page1 = await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id, title: 'Page 1' });
    const page2 = await testUtilsPages.generatePage({ createdBy: user.id, spaceId: space.id, title: 'Page 2' });

    const inputData = {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { id: null, level: 1, track: [] },
          content: [
            {
              text: 'Header',
              type: 'text',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-07-08T01:23:00.000Z',
                    user: '8e54b253-eeca-420d-9727-4598521d8121',
                    approved: true,
                    username: 'Admin'
                  }
                }
              ]
            },
            {
              text: ':',
              type: 'text',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-07-08T01:23:00.000Z',
                    user: '8e54b253-eeca-420d-9727-4598521d8121',
                    approved: true,
                    username: 'Admin'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          attrs: { track: [] },
          content: [
            {
              text: 'Wikipedia - Ethereum',
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://en.wikipedia.org/wiki/Ethereum'
                  }
                },
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-07-08T01:23:00.000Z',
                    user: '8e54b253-eeca-420d-9727-4598521d8121',
                    approved: true,
                    username: 'Admin'
                  }
                }
              ]
            }
          ]
        },
        { type: 'paragraph', attrs: { track: [] } },
        {
          type: 'page',
          attrs: { id: page1.id, track: [] }
        },
        { type: 'paragraph', attrs: { track: [] } },
        { type: 'page', attrs: { id: page2.id, track: [] } },
        { type: 'paragraph', attrs: { track: [] } },
        { type: 'paragraph', attrs: { track: [] } }
      ]
    };
    const exported = await generateMarkdown({ content: inputData });

    expect(exported).toEqual(
      // eslint-disable-next-line prettier/prettier
      `# Header:

[Wikipedia - Ethereum](https://en.wikipedia.org/wiki/Ethereum)

[Page 1](${baseUrl}/${space.domain}/${page1.path})

[Page 2](${baseUrl}/${space.domain}/${page2.path})
`
    );
  });

  it('should convert hard breaks to newlines', async () => {
    const inputData = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { track: [] },
          content: [
            {
              text: 'Content',
              type: 'text',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-08-15T13:50:00.000Z',
                    user: 'ed1a3f61-0d02-4ed2-831a-ed12c188aee6',
                    approved: true,
                    username: 'member'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          attrs: { track: [] },
          content: [
            {
              type: 'hardBreak',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-08-15T13:50:00.000Z',
                    user: 'ed1a3f61-0d02-4ed2-831a-ed12c188aee6',
                    approved: true,
                    username: 'member'
                  }
                }
              ]
            },
            {
              type: 'hardBreak',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-08-15T13:50:00.000Z',
                    user: 'ed1a3f61-0d02-4ed2-831a-ed12c188aee6',
                    approved: true,
                    username: 'member'
                  }
                }
              ]
            },
            {
              type: 'hardBreak',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-08-15T13:50:00.000Z',
                    user: 'ed1a3f61-0d02-4ed2-831a-ed12c188aee6',
                    approved: true,
                    username: 'member'
                  }
                }
              ]
            },
            {
              type: 'hardBreak',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-08-15T13:50:00.000Z',
                    user: 'ed1a3f61-0d02-4ed2-831a-ed12c188aee6',
                    approved: true,
                    username: 'member'
                  }
                }
              ]
            },
            {
              type: 'hardBreak',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-08-15T13:50:00.000Z',
                    user: 'ed1a3f61-0d02-4ed2-831a-ed12c188aee6',
                    approved: true,
                    username: 'member'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'paragraph',
          attrs: { track: [] },
          content: [
            {
              text: 'Second',
              type: 'text',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2023-08-15T13:50:00.000Z',
                    user: 'ed1a3f61-0d02-4ed2-831a-ed12c188aee6',
                    approved: true,
                    username: 'member'
                  }
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
      `Content







Second`
    );
  });

  it('should handle mentions', async () => {
    const content = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: {
            track: []
          },
          content: [
            {
              text: 'Some test data',
              type: 'text'
            },
            {
              text: '@OtherMember account',
              type: 'text',
              marks: [
                {
                  type: 'mentionSuggest',
                  attrs: {
                    trigger: '@'
                  }
                }
              ]
            },
            {
              type: 'hardBreak'
            },
            {
              text: 'Our team will drive increased usage',
              type: 'text'
            }
          ]
        },
        {
          type: 'paragraph',
          attrs: {
            track: []
          },
          content: [
            {
              text: 'Some extra text',
              type: 'text'
            }
          ]
        }
      ]
    };

    const markdown = await generateMarkdown({ content, title: '' });

    expect(markdown).toEqual(`Some test data@OtherMember account
Our team will drive increased usage

Some extra text`);
  });
});
