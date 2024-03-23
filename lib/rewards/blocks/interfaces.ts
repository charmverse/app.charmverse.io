import type { RewardBlock } from '@charmverse/core/prisma';

import type { BlockWithDetails } from 'lib/databases/block';
import type { Board, IPropertyTemplate, BoardFields } from 'lib/databases/board';
import type { BoardViewFields } from 'lib/databases/boardView';
import type { CardPropertyValue } from 'lib/databases/card';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';

import type { ApplicationMeta } from '../interfaces';

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

export type RewardPropertyValue = CardPropertyValue | ApplicationMeta[] | TargetPermissionGroup<'user' | 'role'>[];

export type RewardPropertiesField = Record<string, RewardPropertyValue>;

export type RewardPropertyValues = { properties: RewardPropertiesField };

export type RewardFields = RewardPropertyValues & { isAssigned?: boolean };

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
