export function stubProsemirrorDoc({ text }: { text: string }): any {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text }]
      }
    ]
  };
}
