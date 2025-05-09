import type { ProposalBlock, ProposalReviewer } from '@charmverse/core/prisma';
import type { BoardFields } from '@packages/databases/board';
import type { BoardViewFields } from '@packages/databases/boardView';

export type ProposalPropertyOption = { id: string; color: string; value: string };

export type ProposalPropertyField = { id: string; name: string; type: string; options: ProposalPropertyOption[] };

export type ProposalBoardBlockFields = {
  cardProperties: ProposalPropertyField[];
};
// Properties block with typed fields
export type ProposalBoardBlock = ProposalBlock & {
  fields: ProposalBoardBlockFields | BoardFields;
  type: 'board';
};

// TODO: Add other block types i.e. view.
export type ProposalBlockWithTypedFields = ProposalBoardBlock;

export type ProposalReviewerProperty = Partial<Pick<ProposalReviewer, 'userId' | 'roleId' | 'systemRole'>>[];

export type ProposalPropertyValue = string | string[] | number | ProposalReviewerProperty;

export type ProposalPropertiesField = Record<string, ProposalPropertyValue>;

export type ProposalPropertyValues = { properties: ProposalPropertiesField };

export type ProposalBlockInput = {
  id?: string;
  type: 'board' | 'card';
  spaceId?: string;
  title?: string;
  schema?: number;
  fields?: ProposalBoardBlockFields | ProposalPropertyValues | BoardFields | BoardViewFields;
  parentId?: string;
  rootId?: string;
};

export type ProposalBlockUpdateInput = ProposalBlockInput & {
  id: string;
};
