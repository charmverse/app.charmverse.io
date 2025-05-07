import { extractPreviewImage } from '../extractPreviewImage';

const imageUrl =
  'https://s3.amazonaws.com/charm.public/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/9e70eb21-6e74-4700-ba0e-794668fb6006/Gxvjc_ziDgQ1ZcfwPZxwBMyb1okbtjziAJnSF5dE6kdwdnagvHG0A8LVB5yichnsScyJb873JqGtbTxL81MYvV6DkV0hsgdjAhNF.jpeg';

describe('extractPreviewImage', () => {
  it('should find an image for content', () => {
    const testDoc = {
      type: 'doc',
      content: [
        {
          type: 'image',
          attrs: {
            alt: null,
            src: imageUrl,
            size: 700,
            track: [],
            caption: null
          }
        }
      ]
    };

    const result = extractPreviewImage(testDoc);
    expect(result).toEqual(imageUrl);
  });
});
