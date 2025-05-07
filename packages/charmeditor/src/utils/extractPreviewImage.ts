import type { PageContent, BlockNode } from '../interfaces';

function extractImageURL(item: BlockNode) {
  if (item.type === 'paragraph') {
    const imageNode = item.content?.[0];
    if (imageNode?.type === 'image') {
      if (imageNode.attrs?.src) {
        return imageNode.attrs.src;
      }
    }
  } else if (item.type === 'image') {
    if (item.attrs?.src) {
      return item.attrs.src;
    }
  }
  return '';
}

export function extractPreviewImage(content: PageContent) {
  let galleryImageUrl = '';

  if (content?.content) {
    for (let index = 0; index < content.content.length; index++) {
      const item = content.content[index];
      galleryImageUrl = extractImageURL(item);
      if (galleryImageUrl) {
        break;
      }
    }
  }

  return galleryImageUrl;
}
