export function generatePageContentWithInlineDatabaseRefs({
  inlineDBPageId,
  inlineLinkedDBPageId
}: {
  inlineDBPageId: string;
  inlineLinkedDBPageId: string;
}) {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { id: null, level: 2, track: [] },
        content: [
          {
            text: 'Inline database',
            type: 'text'
          }
        ]
      },
      { type: 'paragraph', attrs: { track: [] } },
      { type: 'inlineDatabase', attrs: { pageId: inlineDBPageId } },
      { type: 'paragraph', attrs: { track: [] } },
      {
        type: 'heading',
        attrs: { id: null, level: 2, track: [] },
        content: [
          {
            text: 'Inline Linked Database',
            type: 'text'
          }
        ]
      },
      { type: 'paragraph', attrs: { track: [] } },
      { type: 'inlineDatabase', attrs: { pageId: inlineLinkedDBPageId } },
      { type: 'paragraph', attrs: { track: [] } }
    ]
  };
}
