import type { RewardBlock } from '@charmverse/core/prisma';
import type { BlockWithDetails } from '@root/lib/databases/block';
import type { Board, IPropertyTemplate, BoardFields } from '@root/lib/databases/board';
import type { BoardViewFields } from '@root/lib/databases/boardView';
import type { CardPropertyValue } from '@root/lib/databases/card';

import type { ApplicationMeta, RewardReviewer } from '../interfaces';

export type RewardBoardFields = {
  cardProperties: IPropertyTemplate[];
};

// Properties block with typed fields
export type RewardsBoardBlock = RewardBlock & {
  fields: RewardBoardFields & BoardFields;
  type: 'board';
};
// Properties block with typed fields
export type RewardsBoardFFBlock = Omit<Board, 'fields' | 'type'> & {
  fields: RewardBoardFields & BoardFields;
  type: 'board';
};

// TODO: Add other block types i.e. view.
export type RewardBlockWithTypedFields = RewardsBoardBlock | BlockWithDetails;

export type RewardPropertyValue = CardPropertyValue | ApplicationMeta[] | RewardReviewer[];

export type RewardPropertiesField = Record<string, RewardPropertyValue>;

export type RewardPropertyValues = { properties: RewardPropertiesField };

export type RewardFields = RewardPropertyValues & { workflowId?: string; isAssigned?: boolean };

export type RewardBlockInput = {
  id?: string;
  type: 'board' | 'view' | 'card';
  spaceId?: string;
  title?: string;
  schema?: number;
  fields?: RewardBoardFields | RewardPropertyValues | BoardFields | BoardViewFields;
  parentId?: string;
  rootId?: string;
};

export type RewardBlockUpdateInput = RewardBlockInput & {
  id: string;
};
