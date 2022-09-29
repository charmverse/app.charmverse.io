
import { v4 } from 'uuid';

const contentBlockTypes = ['text', 'image', 'divider', 'checkbox'] as const;
const blockTypes = [...contentBlockTypes, 'board', 'view', 'card', 'comment', 'unknown'] as const;
type ContentBlockTypes = typeof contentBlockTypes[number]
type BlockTypes = typeof blockTypes[number]

interface BlockPatch {
    spaceId?: string;
    parentId?: string;
    rootId?: string;
    schema?: number;
    type?: BlockTypes;
    title?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedFields?: Record<string, any>;
    deletedFields?: string[];
    deletedAt?: number;
}

interface Block {
    id: string;
    spaceId: string;
    parentId: string;
    rootId: string;
    createdBy: string;
    updatedBy: string;

    schema: number;
    type: BlockTypes;
    title: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: Record<string, any>;

    createdAt: number;
    updatedAt: number;
    deletedAt: number | null;
}

function createBlock (block?: Partial<Block>): Block {
  const now = Date.now();
  return {
    id: block?.id || v4(),
    schema: 1,
    spaceId: block?.spaceId || '',
    parentId: block?.parentId || '',
    rootId: block?.rootId || '',
    createdBy: block?.createdBy || '',
    updatedBy: block?.updatedBy || '',
    type: block?.type || 'unknown',
    fields: block?.fields ? { ...block?.fields } : {},
    title: block?.title || '',
    createdAt: block?.createdAt || now,
    updatedAt: block?.updatedAt || now,
    deletedAt: block?.deletedAt || null
  };
}

export type { ContentBlockTypes, BlockTypes, Block, BlockPatch };
export { blockTypes, contentBlockTypes, createBlock };

