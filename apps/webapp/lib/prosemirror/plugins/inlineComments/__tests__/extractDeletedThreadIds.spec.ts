import { specRegistry } from '@packages/bangleeditor/specRegistry';
import { Node } from 'prosemirror-model';
import { v4 } from 'uuid';

import { extractDeletedThreadIds } from '../extractDeletedThreadIds';

describe('extractDeletedThreadIds', () => {
  it('should extract threads ids that was present in the previous document but not present in the current document', () => {
    const [thread1Id, thread2Id] = [v4(), v4()];

    const deletedThreadIds = extractDeletedThreadIds(
      specRegistry.schema,
      Node.fromJSON(specRegistry.schema, {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                text: 'Hello ',
                type: 'text'
              },
              {
                text: 'Bold ',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  }
                ]
              },
              {
                text: 'Thread',
                type: 'text',
                marks: [
                  {
                    type: 'inline-comment',
                    attrs: {
                      id: thread1Id,
                      resolved: false
                    }
                  },
                  {
                    type: 'bold'
                  }
                ]
              }
            ]
          }
        ]
      }),
      Node.fromJSON(specRegistry.schema, {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                text: 'Hello ',
                type: 'text'
              },
              {
                text: 'Bold ',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  }
                ]
              },
              {
                text: 'Thread',
                type: 'text',
                marks: [
                  {
                    type: 'inline-comment',
                    attrs: {
                      id: thread1Id,
                      resolved: false
                    }
                  },
                  {
                    type: 'bold'
                  }
                ]
              },
              {
                text: ' ',
                type: 'text',
                marks: [
                  {
                    type: 'bold'
                  }
                ]
              },
              {
                text: 'Non marked ',
                type: 'text'
              },
              {
                text: 'thread',
                type: 'text',
                marks: [
                  {
                    type: 'inline-comment',
                    attrs: {
                      id: thread2Id,
                      resolved: false
                    }
                  }
                ]
              }
            ]
          }
        ]
      })
    );

    expect(deletedThreadIds).toStrictEqual([thread2Id]);
  });
});
