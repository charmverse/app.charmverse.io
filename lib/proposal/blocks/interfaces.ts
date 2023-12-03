import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { ProposalBlock } from '@charmverse/core/prisma-client';

import type { NewPageValues } from 'components/common/PageDialog/hooks/useNewPage';
import type { BoardFields } from 'lib/focalboard/board';
import type { BoardViewFields } from 'lib/focalboard/boardView';
import type { UpdateableRewardFields } from 'lib/rewards/updateRewardSettings';

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

export type ProposalPropertyValue = string | string[] | number | TargetPermissionGroup<'user' | 'role'>[];

export type ProposalPropertiesField = Record<string, ProposalPropertyValue>;

export type ProposalPropertyValues = { properties: ProposalPropertiesField };

export type ProposalDraftReward = { reward: UpdateableRewardFields; page: NewPageValues | null; draftId: string };

export type ProposalFields = ProposalPropertyValues & { draftRewards?: ProposalDraftReward[] };

export type ProposalFieldsProp = { fields: ProposalFields };

export type ProposalBlockInput = {
  id?: string;
  type: string;
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
