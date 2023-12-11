import type { RewardBlock } from '@charmverse/core/prisma-client';

import type { Block } from 'lib/focalboard/block';
import type { BoardFields } from 'lib/focalboard/board';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import type { Card, CardPropertyValue } from 'lib/focalboard/card';
import type { TargetPermissionGroup } from 'lib/permissions/interfaces';

import type { ApplicationMeta } from '../interfaces';

export type RewardPropertyOption = { id: string; color: string; value: string };

export type RewardPropertyField = { id: string; name: string; type: string; options: RewardPropertyOption[] };

export type RewardPropertiesBlockFields = {
  cardProperties: RewardPropertyField[];
};
// Properties block with typed fields
export type RewardPropertiesBlock = RewardBlock & {
  fields: RewardPropertiesBlockFields | BoardFields;
  type: 'board' | 'view';
};

// TODO: Add other block types i.e. view.
export type RewardBlockWithTypedFields = RewardPropertiesBlock | Block;

export type RewardPropertyValue = CardPropertyValue | ApplicationMeta[] | TargetPermissionGroup<'user' | 'role'>[];

export type RewardPropertiesField = Record<string, RewardPropertyValue>;

export type RewardPropertyValues = { properties: RewardPropertiesField };

export type RewardFields = RewardPropertyValues;

export type RewardFieldsProp = { fields: RewardFields };

export type RewardCard = Card<RewardPropertyValue>;

export type RewardBlockInput = {
  id?: string;
  type: string;
  spaceId?: string;
  title?: string;
  schema?: number;
  fields?: RewardPropertiesBlockFields | RewardPropertyValues | BoardFields | BoardViewFields;
  parentId?: string;
  rootId?: string;
};

export type RewardBlockUpdateInput = RewardBlockInput & {
  id: string;
};
