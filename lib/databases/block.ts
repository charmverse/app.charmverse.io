import type { PageType, Block as PrismaBlock, Page } from '@charmverse/core/prisma';
import difference from 'lodash/difference';
import { v4 } from 'uuid';

import type { OptionalFalseyFields } from 'lib/utils/objects';
import { replaceS3Domain } from 'lib/utils/url';

import { Constants } from './constants';

// export const contentBlockTypes = ['text', 'image', 'divider', 'checkbox'] as const;
export const blockTypes = ['board', 'view', 'card', 'unknown'] as const;
export type BlockTypes = (typeof blockTypes)[number];

type PageFields = Pick<
  Page,
  | 'title'
  | 'headerImage'
  | 'galleryImage'
  | 'hasContent'
  | 'syncWithPageId'
  | 'updatedBy'
  | 'updatedAt'
  | 'type'
  | 'id'
  | 'bountyId'
  | 'icon'
>;

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

type Block = {
  id: string;
  spaceId: string;
  parentId?: string;
  rootId: string;
  createdBy: string;
  updatedBy: string;

  // schema: number;
  type: BlockTypes;
  title: string;
  fields: Record<string, any>;

  createdAt: number;
  updatedAt: number;
  deletedAt?: number | null;
};

// The following fields always have a value, and therefore will never be optional
type RequiredFields = 'id' | 'spaceId' | 'rootId' | 'createdBy' | 'updatedBy' | 'createdAt' | 'updatedAt';

export type BlockWithDetails = OptionalFalseyFields<
  Omit<PrismaBlock, 'fields' | 'schema' | 'type' | RequiredFields> & {
    pageId?: string;
    bountyId?: string;
    galleryImage?: string;
    icon?: string;
    hasContent?: boolean;
    pageType?: PageType;
    syncWithPageId?: string;
  }
> &
  Pick<PrismaBlock, RequiredFields> & { fields: Record<string, any>; type: BlockTypes };

export type UIBlockWithDetails = Block & {
  pageId?: string;
  bountyId?: string;
  galleryImage?: string;
  icon?: string;
  hasContent?: boolean;
  pageType?: PageType;
};

// cant think of a better word for this.. handle some edge cases with types from the prisma client
export type PrismaBlockSortOf = Omit<PrismaBlock, 'fields' | 'type'> & { fields: any; type: BlockTypes };

export function createBlock(block?: Partial<UIBlockWithDetails>): UIBlockWithDetails {
  const createdAt = block?.createdAt ?? Date.now();
  const updatedAt = block?.updatedAt || createdAt;
  return {
    id: block?.id || v4(),
    createdAt,
    createdBy: block?.createdBy || '',
    deletedAt: block?.deletedAt || null,
    fields: block?.fields ? { ...block?.fields } : {},
    galleryImage: block?.galleryImage || '',
    icon: block?.icon,
    title: block?.title || '',
    pageId: block?.pageId,
    pageType: block?.pageType,
    spaceId: block?.spaceId || '',
    parentId: block?.parentId || '',
    rootId: block?.rootId || '',
    type: block?.type || 'unknown',
    updatedAt,
    updatedBy: block?.updatedBy || ''
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
export function blockToPrisma(fbBlock: UIBlockWithDetails): PrismaBlockSortOf {
  return {
    id: fbBlock.id,
    parentId: fbBlock.parentId || '',
    rootId: fbBlock.rootId,
    spaceId: fbBlock.spaceId,
    updatedBy: fbBlock.updatedBy,
    createdBy: fbBlock.createdBy,
    schema: 1,
    type: fbBlock.type,
    title: fbBlock.title,
    fields: fbBlock.fields,
    deletedAt: fbBlock.deletedAt === 0 ? null : fbBlock.deletedAt ? new Date(fbBlock.deletedAt) : null,
    createdAt: !fbBlock.createdAt || fbBlock.createdAt === 0 ? new Date() : new Date(fbBlock.createdAt),
    updatedAt: !fbBlock.updatedAt || fbBlock.updatedAt === 0 ? new Date() : new Date(fbBlock.updatedAt)
  };
}
export function blockToPrismaPartial(fbBlock: Partial<UIBlockWithDetails>): Partial<PrismaBlockSortOf> {
  return {
    parentId: fbBlock.parentId || '',
    rootId: fbBlock.rootId,
    spaceId: fbBlock.spaceId,
    updatedBy: fbBlock.updatedBy,
    createdBy: fbBlock.createdBy,
    schema: 1,
    type: fbBlock.type,
    title: fbBlock.title,
    fields: fbBlock.fields,
    deletedAt: fbBlock.deletedAt === 0 ? null : fbBlock.deletedAt ? new Date(fbBlock.deletedAt) : null,
    createdAt: !fbBlock.createdAt || fbBlock.createdAt === 0 ? new Date() : new Date(fbBlock.createdAt),
    updatedAt: !fbBlock.updatedAt || fbBlock.updatedAt === 0 ? new Date() : new Date(fbBlock.updatedAt)
  };
}

// use this method for blocks like views that do not have a page
export function prismaToBlock(block: PrismaBlock): Block {
  return {
    id: block.id,
    parentId: block.parentId,
    rootId: block.rootId,
    spaceId: block.spaceId,
    updatedBy: block.updatedBy,
    createdBy: block.createdBy,
    type: block.type as BlockTypes,
    title: block.title,
    fields: block.fields as any,
    deletedAt: block.deletedAt ? block.deletedAt.getTime() : null,
    createdAt: block.createdAt.getTime(),
    updatedAt: block.updatedAt.getTime()
  };
}

export function prismaToUIBlock(block: PrismaBlock, page: PageFields): UIBlockWithDetails {
  return blockToUIBlock(applyPageToBlock(block, page));
}

export function blockToUIBlock(block: BlockWithDetails): UIBlockWithDetails {
  let fields = block.fields as UIBlockWithDetails['fields'];
  if ('headerImage' in fields) {
    // reassign fields to avoid mutation error
    fields = {
      ...fields,
      headerImage: replaceS3Domain(fields.headerImage)
    };
  }
  return {
    ...block,
    deletedAt: block.deletedAt ? new Date(block.deletedAt).getTime() : 0,
    createdAt: new Date(block.createdAt).getTime(),
    updatedAt: new Date(block.updatedAt).getTime(),
    title: block.title || '',
    type: block.type as UIBlockWithDetails['type'],
    fields
  };
}

// mutative method, for performance reasons
export function applyPageToBlock(block: PrismaBlock, page: PageFields): BlockWithDetails {
  const blockWithDetails = block as BlockWithDetails;
  blockWithDetails.bountyId = page.bountyId || undefined;
  blockWithDetails.pageId = page.id;
  blockWithDetails.syncWithPageId = page.syncWithPageId || undefined;
  blockWithDetails.icon = page.icon || undefined;
  blockWithDetails.galleryImage = replaceS3Domain(page.headerImage || page.galleryImage || undefined);
  blockWithDetails.hasContent = page.hasContent;
  blockWithDetails.title = page.title || block.title;
  blockWithDetails.pageType = page.type;
  blockWithDetails.updatedAt = page.updatedAt;
  blockWithDetails.updatedBy = page.updatedBy;
  // used for sorting
  // if (blockWithDetails.type === 'card') {
  //   blockWithDetails.fields ||= { properties: {} };
  // blockWithDetails.fields.properties ||= {};
  // blockWithDetails.fields.properties[Constants.titleColumnId] = blockWithDetails.title;
  // }
  return blockWithDetails;
}
