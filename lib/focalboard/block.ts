import type { Prisma, Block as PrismaBlock } from '@prisma/client';
import difference from 'lodash/difference';
import { v4 } from 'uuid';

export const contentBlockTypes = ['text', 'image', 'divider', 'checkbox'] as const;
export const blockTypes = [...contentBlockTypes, 'board', 'view', 'card', 'comment', 'unknown'] as const;
export type BlockTypes = (typeof blockTypes)[number];

export type BlockPatch = {
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
};

export type Block = {
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
};

// cant think of a better word for this.. handle some edge cases with types from the prisma client
export type PrismaBlockSortOf = Omit<PrismaBlock, 'fields' | 'type'> & { fields: any; type: BlockTypes };

export function createBlock(block?: Partial<Block>): Block {
  const createdAt = block?.createdAt ?? Date.now();
  const updatedAt = block?.updatedAt || createdAt;
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
    createdAt,
    updatedAt,
    deletedAt: block?.deletedAt || null
  };
}

// createPatchesFromBlock creates two BlockPatch instances, one that
// contains the delta to update the block and another one for the undo
// action, in case it happens
export function createPatchesFromBlocks(newBlock: Block, oldBlock: Block): BlockPatch[] {
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

// export to BlockUncheckedCreateInput instead of regular Block so that the json 'fields' value is compatible with Prisma ops
export function blockToPrisma(fbBlock: Block): PrismaBlockSortOf {
  return {
    id: fbBlock.id,
    parentId: fbBlock.parentId,
    rootId: fbBlock.rootId,
    spaceId: fbBlock.spaceId,
    updatedBy: fbBlock.updatedBy,
    createdBy: fbBlock.createdBy,
    schema: fbBlock.schema,
    type: fbBlock.type,
    title: fbBlock.title,
    fields: fbBlock.fields,
    deletedAt: fbBlock.deletedAt === 0 ? null : fbBlock.deletedAt ? new Date(fbBlock.deletedAt) : null,
    createdAt: !fbBlock.createdAt || fbBlock.createdAt === 0 ? new Date() : new Date(fbBlock.createdAt),
    updatedAt: !fbBlock.updatedAt || fbBlock.updatedAt === 0 ? new Date() : new Date(fbBlock.updatedAt)
  };
}

export function prismaToBlock(block: PrismaBlock): Block {
  return {
    id: block.id,
    parentId: block.parentId,
    rootId: block.rootId,
    spaceId: block.spaceId,
    updatedBy: block.updatedBy,
    createdBy: block.createdBy,
    schema: block.schema,
    type: block.type as BlockTypes,
    title: block.title,
    fields: block.fields as any,
    deletedAt: block.deletedAt ? block.deletedAt.getTime() : null,
    createdAt: block.createdAt.getTime(),
    updatedAt: block.updatedAt.getTime()
  };
}
