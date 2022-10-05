import type { PageContent } from 'models';

export function getPreviewImageFromContent (content: PageContent) {
  let galleryImageUrl = '';

  if (content?.content) {
    for (let index = 0; index < content.content.length; index++) {
      const item = content.content[index];

      if (item.type === 'paragraph') {
        const imageNode = item.content?.[0];
        if (imageNode?.type === 'image') {
          if (imageNode.attrs?.src) {
            galleryImageUrl = imageNode.attrs.src;
            break;
          }
        }
      }
      else if (item.type === 'image') {
        if (item.attrs?.src) {
          galleryImageUrl = item.attrs.src;
          break;
        }
      }
    }
  }

  return galleryImageUrl;
}
