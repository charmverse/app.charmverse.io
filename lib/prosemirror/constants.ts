// include a paragraph by default so that when a user clicks on the document, the cursor appears properly
export const emptyDocument = {
  type: 'doc',
  content: [
    {
      type: 'paragraph'
    }
  ]
};
