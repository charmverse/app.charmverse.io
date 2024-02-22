import type { RewardBlock } from '@charmverse/core/prisma-client';

import type { Block } from 'lib/focalboard/block';
import type { Board, IPropertyTemplate, BoardFields } from 'lib/focalboard/board';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import type { Card, CardPropertyValue } from 'lib/focalboard/card';
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
export type RewardBlockWithTypedFields = RewardsBoardBlock | Block;

export type RewardPropertyValue = CardPropertyValue | ApplicationMeta[] | TargetPermissionGroup<'user' | 'role'>[];

export type RewardPropertiesField = Record<string, RewardPropertyValue>;

export type RewardPropertyValues = { properties: RewardPropertiesField };

export type RewardFields = RewardPropertyValues & { isAssigned?: boolean };

export type RewardFieldsProp = { fields: RewardFields };

export type RewardBlockInput = {
  id?: string;
  type: string;
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
