import { extractMentions } from '../extractMentions';

describe('extractMentions', () => {
  it('Should extract mentions for a page content json node', () => {
    expect(
      extractMentions({
        type: 'doc',
        content: [
          {
            type: 'disclosureDetails',
            content: [
              {
                type: 'disclosureSummary',
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'mention',
                        attrs: {
                          id: 'e19f34b7-2833-4805-8989-60f2bfd6a92b',
                          type: 'page',
                          value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
                          createdAt: '2022-06-15T15:38',
                          createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f'
                        }
                      }
                    ]
                  },
                  {
                    type: 'paragraph',
                    content: [
                      {
                        type: 'mention',
                        attrs: {
                          id: 'e19f34b7-2833-4805-8989-60f2bfd6a92b',
                          type: 'user',
                          value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
                          createdAt: '2022-06-15T15:38',
                          createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f'
                        }
                      },
                      { text: ' ', type: 'text' }
                    ]
                  }
                ]
              },
              {
                type: 'paragraph',
                content: [
                  { text: 'Mention inside ', type: 'text' },
                  {
                    type: 'mention',
                    attrs: {
                      id: 'e5ac7eef-c212-4e3c-b5be-64ad7a57f3da',
                      type: 'user',
                      value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f'
                    }
                  },
                  { text: ' toggle', type: 'text' }
                ]
              }
            ]
          },
          {
            type: 'heading',
            attrs: { level: 1 },
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
          {
            type: 'blockquote',
            attrs: { emoji: '😃' },
            content: [
              {
                type: 'paragraph',
                content: [
                  { text: 'Mentioned in ', type: 'text' },
                  {
                    type: 'mention',
                    attrs: {
                      id: '4845e106-273f-45aa-9118-239699901663',
                      type: 'user',
                      value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
                      createdAt: '2022-06-14T16:23:53.337Z',
                      createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f'
                    }
                  },
                  { text: ' Callout', type: 'text' }
                ]
              }
            ]
          },
          { type: 'paragraph' },
          {
            type: 'orderedList',
            attrs: { order: 1, tight: false },
            content: [
              {
                type: 'listItem',
                attrs: { todoChecked: null },
                content: [
                  {
                    type: 'paragraph',
                    content: [
                      { text: 'Bullet list ', type: 'text' },
                      {
                        type: 'mention',
                        attrs: {
                          id: '0c76a79e-fde4-4f52-b626-cb34adb57ae0',
                          type: 'user',
                          value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
                          createdAt: '2022-06-14T16:24:05.723Z',
                          createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f'
                        }
                      },
                      {
                        type: 'mention',
                        attrs: {
                          id: '0c76a79e-fdec-3f51-b626-cb34adb57ae1',
                          type: 'role',
                          value: 'everyone',
                          createdAt: '2022-06-14T16:24:07.157Z',
                          createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f'
                        }
                      },
                      { text: ' Mentions', type: 'text' }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }).map((mention) => {
        const { parentNode, ...rest } = mention;
        return rest;
      })
    ).toStrictEqual([
      {
        id: 'e19f34b7-2833-4805-8989-60f2bfd6a92b',
        createdAt: '2022-06-15T15:38',
        createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        type: 'user'
      },
      {
        id: 'd3067f54-0a1c-439a-8317-694056cc25bc',
        createdAt: '2022-06-15T15:38:53.905Z',
        createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        type: 'user'
      },
      {
        id: '4845e106-273f-45aa-9118-239699901663',
        createdAt: '2022-06-14T16:23:53.337Z',
        createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        type: 'user'
      },
      {
        id: '0c76a79e-fde4-4f52-b626-cb34adb57ae0',
        createdAt: '2022-06-14T16:24:05.723Z',
        createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        value: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        type: 'user'
      },
      {
        id: '0c76a79e-fdec-3f51-b626-cb34adb57ae1',
        createdAt: '2022-06-14T16:24:07.157Z',
        createdBy: '30980dd8-9ef1-43ad-83f5-f5ff64db193f',
        value: 'everyone',
        type: 'role'
      }
    ]);
  });
});
