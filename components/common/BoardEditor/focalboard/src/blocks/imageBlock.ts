import type { Block } from './block';
import { createBlock } from './block';
import type { ContentBlock } from './contentBlock';

type ImageBlockFields = {
    fileId: string;
}

type ImageBlock = ContentBlock & {
    type: 'image';
    fields: ImageBlockFields;
}

function createImageBlock (block?: Block): ImageBlock {
  return {
    ...createBlock(block),
    type: 'image',
    fields: {
      fileId: block?.fields.fileId || ''
    }
  };
}

export { createImageBlock };
export type { ImageBlock };
