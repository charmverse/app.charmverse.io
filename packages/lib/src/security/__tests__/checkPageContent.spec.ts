import { InsecureOperationError } from '@packages/core/errors';

import { checkPageContent } from '../checkPageContent';

describe('checkPageContent', () => {
  it('should throw an error if potentially unsafe content is detected in text', () => {
    const unsafePageContent = {
      type: 'doc',
      content: [
        {
          type: 'blockquote',
          attrs: { emoji: '😃', track: [] },
          content: [
            {
              type: 'heading',
              attrs: { id: null, level: 2, track: [] },
              content: [
                {
                  text: 'www.unsafe.ru',
                  type: 'text'
                }
              ]
            }
          ]
        }
      ]
    };

    expect(() => checkPageContent(unsafePageContent)).toThrow(InsecureOperationError);
  });

  it('should throw an error if potentially unsafe content is detected in node marks', () => {
    const unsafePageContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { track: [] },
          content: [
            {
              text: 'tokens',
              type: 'text',
              marks: [
                { type: 'link', attrs: { href: 'https://www.content.ru' } },
                {
                  type: 'insertion',
                  attrs: {
                    date: '2022-11-16T16:30:00.000Z',
                    user: '4a5a6115-3062-412c-86df-116aab3712fe',
                    approved: true,
                    username: 'User'
                  }
                }
              ]
            }
          ]
        }
      ]
    };

    expect(() => checkPageContent(unsafePageContent)).toThrow(InsecureOperationError);
  });

  it('should not throw an error if no unsafe content is detected', () => {
    const unsafePageContent = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          attrs: { track: [] },
          content: [
            {
              text: 'tokens',
              type: 'text',
              marks: [
                { type: 'link', attrs: { href: 'https://www.example.com' } },
                {
                  type: 'insertion',
                  attrs: {
                    date: '2022-11-16T16:30:00.000Z',
                    user: '4a5a6115-3062-412c-86df-116aab3712fe',
                    approved: true,
                    username: 'User'
                  }
                }
              ]
            },
            {
              text: '/NFTs. ',
              type: 'text',
              marks: [
                {
                  type: 'insertion',
                  attrs: {
                    date: '2022-11-16T16:30:00.000Z',
                    user: '4a5a6115-3062-412c-86df-116aab3712fe',
                    approved: true,
                    username: 'User'
                  }
                }
              ]
            }
          ]
        },
        {
          type: 'blockquote',
          attrs: { emoji: '😃', track: [] },
          content: [
            {
              type: 'heading',
              attrs: { id: null, level: 2, track: [] },
              content: [
                {
                  text: 'Example',
                  type: 'text',
                  marks: [
                    { type: 'link', attrs: { href: 'https://www.example.com' } },
                    {
                      type: 'insertion',
                      attrs: {
                        date: '2023-11-27T19:50:00.000Z',
                        user: 'fe9f440e-f58d-4338-ba05-3a54becc9686',
                        approved: true,
                        username: 'abc.eth'
                      }
                    }
                  ]
                }
              ]
            },
            { type: 'paragraph', attrs: { track: [] } }
          ]
        }
      ]
    };

    expect(checkPageContent(unsafePageContent)).toBe(undefined);
  });

  it('should exit successfully if pageContent is null', () => {
    expect(checkPageContent(null)).toBe(undefined);
  });
});
