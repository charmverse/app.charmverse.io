import { DocumentEventHandler } from '../documentEvents/documentEvents';
import type { ProsemirrorJSONStep } from '../documentEvents/interfaces';

describe('Web sockets: Document handler', () => {
  it('removeTooltipMarks() should remove tooltip markers from messages', async () => {
    const diff: ProsemirrorJSONStep = {
      to: 809,
      from: 806,
      slice: {
        content: [
          {
            type: 'bulletList',
            content: []
          },
          {
            type: 'tweet',
            marks: [
              {
                type: 'tooltip-marker',
                attrs: {
                  trigger: 'image'
                }
              }
            ]
          }
        ]
      },
      stepType: 'replace'
    };
    const result = DocumentEventHandler.prototype.removeTooltipMarks(diff);
    expect(JSON.stringify(result)).not.toMatch(/tooltip-marker/);
  });
});
