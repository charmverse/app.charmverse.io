export function generatePageContentWithInlineDatabaseRefs({
  inlineDatabaseId,
  inlineLinkedDatabaseId
}: {
  inlineDatabaseId: string;
  inlineLinkedDatabaseId: string;
}) {
  return {
    type: 'doc',
    content: [
      {
        type: 'heading',
        attrs: { id: null, level: 2, track: [], collapseContent: null },
        content: [
          {
            text: 'Inline database',
            type: 'text'
          }
        ]
      },
      { type: 'paragraph', attrs: { track: [] } },
      { type: 'inlineDatabase', attrs: { pageId: inlineDatabaseId } },
      { type: 'paragraph', attrs: { track: [] } },
      {
        type: 'heading',
        attrs: { id: null, level: 2, track: [], collapseContent: null },
        content: [
          {
            text: 'Inline Linked Database',
            type: 'text'
          }
        ]
      },
      { type: 'paragraph', attrs: { track: [] } },
      { type: 'inlineDatabase', attrs: { pageId: inlineLinkedDatabaseId } },
      { type: 'paragraph', attrs: { track: [] } }
    ]
  };
}
