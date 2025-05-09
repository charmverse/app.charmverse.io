import { uuid } from '@bangle.dev/utils';

export function getContentWithMention({ myUserId, targetUserId }: { myUserId: string; targetUserId: string }) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'mention',
            attrs: {
              id: uuid(),
              type: 'user',
              value: targetUserId,
              createdAt: new Date().toISOString(),
              createdBy: myUserId
            }
          },
          {
            type: 'text',
            text: ' '
          }
        ]
      }
    ]
  };
}
