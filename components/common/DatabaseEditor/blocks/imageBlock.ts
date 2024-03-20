import type { Block } from 'lib/databases/block';
import { createBlock } from 'lib/databases/block';

import type { ContentBlock } from './contentBlock';

type ImageBlockFields = {
  fileId: string;
};

type ImageBlock = ContentBlock & {
  type: 'image';
  fields: ImageBlockFields;
};

function createImageBlock(block?: Block): ImageBlock {
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
