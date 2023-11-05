// include a paragraph by default so that when a user clicks on the document, the cursor appears properly
export const emptyDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph'
    }
  ]
};

export const createDocumentWithText = (text: string) => ({
  type: 'doc',
  content: [
    {
      type: 'paragraph',
      content: [
        {
          type: 'text',
          text
        }
      ]
    }
  ]
});
