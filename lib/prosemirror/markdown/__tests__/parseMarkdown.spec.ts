import { parseMarkdown } from '../parseMarkdown';

describe('parseMarkdown()', () => {
  it('Should parse a simple sentence', () => {
    const result = parseMarkdown('Markdown title content\r\n\r\nNew line');

    expect(result).toEqual({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: {
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'Markdown title content'
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
              type: 'text',
              text: 'New line'
            }
          ]
        }
      ]
    });
  });

  it('should parse markdown', () => {
    // The mardown text markers need to be at the beginning of the line to be parsed correctly
    const result = parseMarkdown(`
# My Markdown Document

## Introduction

This is the introduction section. You can learn more about Markdown [here](https://www.markdownguide.org/).

## Features

- **Easy to Learn**: Markdown is easy to learn. [Learn More](https://www.markdownguide.org/getting-started/)
- **Portable**: You can use Markdown files anywhere.
- **Flexible**: Markdown can be converted to many formats.

## How to Use Markdown

### Headers

To create headers, use the # symbol followed by a space. For example:

# This is an H1
## This is an H2
### This is an H3

Links

To create links, wrap the link text in square brackets [] and the URL in parentheses (). For example:
`);
    expect(result).toEqual({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: {
            level: 1,
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'My Markdown Document'
            }
          ]
        },
        {
          type: 'heading',
          attrs: {
            level: 2,
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'Introduction'
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
              type: 'text',
              text: 'This is the introduction section. You can learn more about Markdown '
            },
            {
              type: 'text',
              marks: [
                {
                  type: 'link',
                  attrs: {
                    href: 'https://www.markdownguide.org/'
                  }
                }
              ],
              text: 'here'
            },
            {
              type: 'text',
              text: '.'
            }
          ]
        },
        {
          type: 'heading',
          attrs: {
            level: 2,
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'Features'
            }
          ]
        },
        {
          type: 'bullet_list',
          attrs: {
            indent: 0,
            listStyleType: null
          },
          content: [
            {
              type: 'list_item',
              attrs: {
                todoChecked: null,
                track: []
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    track: []
                  },
                  content: [
                    {
                      type: 'text',
                      marks: [
                        {
                          type: 'bold'
                        }
                      ],
                      text: 'Easy to Learn'
                    },
                    {
                      type: 'text',
                      text: ': Markdown is easy to learn. '
                    },
                    {
                      type: 'text',
                      marks: [
                        {
                          type: 'link',
                          attrs: {
                            href: 'https://www.markdownguide.org/getting-started/'
                          }
                        }
                      ],
                      text: 'Learn More'
                    }
                  ]
                }
              ]
            },
            {
              type: 'list_item',
              attrs: {
                todoChecked: null,
                track: []
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    track: []
                  },
                  content: [
                    {
                      type: 'text',
                      marks: [
                        {
                          type: 'bold'
                        }
                      ],
                      text: 'Portable'
                    },
                    {
                      type: 'text',
                      text: ': You can use Markdown files anywhere.'
                    }
                  ]
                }
              ]
            },
            {
              type: 'list_item',
              attrs: {
                todoChecked: null,
                track: []
              },
              content: [
                {
                  type: 'paragraph',
                  attrs: {
                    track: []
                  },
                  content: [
                    {
                      type: 'text',
                      marks: [
                        {
                          type: 'bold'
                        }
                      ],
                      text: 'Flexible'
                    },
                    {
                      type: 'text',
                      text: ': Markdown can be converted to many formats.'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          type: 'heading',
          attrs: {
            level: 2,
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'How to Use Markdown'
            }
          ]
        },
        {
          type: 'heading',
          attrs: {
            level: 3,
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'Headers'
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
              type: 'text',
              text: 'To create headers, use the # symbol followed by a space. For example:'
            }
          ]
        },
        {
          type: 'heading',
          attrs: {
            level: 1,
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'This is an H1'
            }
          ]
        },
        {
          type: 'heading',
          attrs: {
            level: 2,
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'This is an H2'
            }
          ]
        },
        {
          type: 'heading',
          attrs: {
            level: 3,
            track: []
          },
          content: [
            {
              type: 'text',
              text: 'This is an H3'
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
              type: 'text',
              text: 'Links'
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
              type: 'text',
              text: 'To create links, wrap the link text in square brackets [] and the URL in parentheses (). For example:'
            }
          ]
        }
      ]
    });
  });
});
