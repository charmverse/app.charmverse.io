
import difference from 'lodash/difference';

import { Utils } from '../utils';

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
    id: block?.id || Utils.createGuid(Utils.blockTypeToIDType(block?.type)),
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

// createPatchesFromBlock creates two BlockPatch instances, one that
// contains the delta to update the block and another one for the undo
// action, in case it happens
function createPatchesFromBlocks (newBlock: Block, oldBlock: Block): BlockPatch[] {
  const newDeletedFields = difference(Object.keys(newBlock.fields), Object.keys(oldBlock.fields));
  const newUpdatedFields: Record<string, any> = {};
  const newUpdatedData: Record<string, any> = {};
  Object.keys(newBlock.fields).forEach((val) => {
    if (oldBlock.fields[val] !== newBlock.fields[val]) {
      newUpdatedFields[val] = newBlock.fields[val];
    }
  });
  Object.keys(newBlock).forEach((val) => {
    if (val !== 'fields' && (oldBlock as any)[val] !== (newBlock as any)[val]) {
      newUpdatedData[val] = (newBlock as any)[val];
    }
  });

  const oldDeletedFields = difference(Object.keys(oldBlock.fields), Object.keys(newBlock.fields));
  const oldUpdatedFields: Record<string, any> = {};
  const oldUpdatedData: Record<string, any> = {};
  Object.keys(oldBlock.fields).forEach((val) => {
    if (oldBlock.fields[val] !== newBlock.fields[val]) {
      oldUpdatedFields[val] = oldBlock.fields[val];
    }
  });
  Object.keys(oldBlock).forEach((val) => {
    if (val !== 'fields' && (oldBlock as any)[val] !== (newBlock as any)[val]) {
      oldUpdatedData[val] = (oldBlock as any)[val];
    }
  });

  return [
    {
      ...newUpdatedData,
      updatedFields: newUpdatedFields,
      deletedFields: oldDeletedFields
    },
    {
      ...oldUpdatedData,
      updatedFields: oldUpdatedFields,
      deletedFields: newDeletedFields
    }
  ];
}

export type { ContentBlockTypes, BlockTypes, Block, BlockPatch };
export { blockTypes, contentBlockTypes, createBlock, createPatchesFromBlocks };

