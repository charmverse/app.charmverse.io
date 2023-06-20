import * as specs from 'testing/prosemirror';

import { countBlocks } from '../countBlocks';

describe('countBlocks()', () => {
  it('Should extract first few text blocks', () => {
    const contents = [specs.heading('Every'), specs.p('good')];
    const node = specs.doc(...contents).toJSON();
    const result = countBlocks(node);
    expect(result).toBe(2);
  });

  const content = {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { level: 3, track: [], collapseContent: null },
        content: [
          {
            text: 'Please follow these onboarding steps:',
            type: 'text',
            marks: [
              {
                type: 'insertion',
                attrs: {
                  date: '2022-12-15T21:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              }
            ]
          }
        ]
      },
      { type: 'paragraph', attrs: { track: [] } },
      {
        type: 'blockquote',
        attrs: { emoji: '1️⃣', track: [] },
        content: [
          {
            type: 'paragraph',
            attrs: { track: [] },
            content: [
              {
                text: 'Nunc faucibus lectus tellus, vitae ullamcorper ipsum placerat ac.',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-16T12:10:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  { type: 'text-color', attrs: { color: null, bgColor: null } }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'blockquote',
        attrs: { emoji: '2️⃣', track: [] },
        content: [
          {
            type: 'paragraph',
            attrs: { track: [] },
            content: [
              {
                text: 'Sed pretium, ipsum nec elementum porttitor, purus ipsum hendrerit elit, vitae semper dolor velit id ligula.',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-16T12:10:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  { type: 'text-color', attrs: { color: null, bgColor: null } }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'blockquote',
        attrs: { emoji: '3️⃣', track: [] },
        content: [
          {
            type: 'paragraph',
            attrs: { track: [] },
            content: [
              {
                text: 'Mauris iaculis dolor quis turpis consectetur, ut placerat odio sodales.',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-16T12:10:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  { type: 'text-color', attrs: { color: null, bgColor: null } }
                ]
              }
            ]
          }
        ]
      },
      {
        type: 'blockquote',
        attrs: { emoji: '4️⃣', track: [] },
        content: [
          {
            type: 'paragraph',
            attrs: { track: [] },
            content: [
              {
                text: 'Vivamus varius scelerisque nibh eu egestas. Suspendisse non cursus massa, ut suscipit velit. Phasellus gravida tempor efficitur.',
                type: 'text',
                marks: [
                  {
                    type: 'insertion',
                    attrs: {
                      date: '2022-12-16T12:10:00.000Z',
                      user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                      approved: true,
                      username: 'Drea | CharmVerse'
                    }
                  },
                  { type: 'text-color', attrs: { color: null, bgColor: null } }
                ]
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
                  date: '2022-12-15T21:20:00.000Z',
                  user: 'e5dba747-be62-49be-a7ba-71cf27b17174',
                  approved: true,
                  username: 'Drea | CharmVerse'
                }
              }
            ]
          }
        ]
      },
      { type: 'paragraph', attrs: { track: [] } }
    ]
  };

  it('Should extract first few text blocks', () => {
    const result = countBlocks(content);
    expect(result).toBe(12);
  });
});
