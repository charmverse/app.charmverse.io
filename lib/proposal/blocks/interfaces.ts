import type { ProposalBlock, ProposalBlockType } from '@charmverse/core/prisma-client';

import type { IPropertyTemplate } from 'lib/focalboard/board';

export type ProposalPropertiesBlockFields = {
  properties: IPropertyTemplate[];
};

// Properties block with typed fields
export type ProposalPropertiesBlock = ProposalBlock & {
  fields: ProposalPropertiesBlockFields;
  type: typeof ProposalBlockType.properties;
};

// TODO: Add other block types i.e. view.
export type ProposalBlockWithTypedFields = ProposalPropertiesBlock;

export type ProposalBlockInput = {
  type: ProposalBlockType;
  spaceId: string;
  title?: string;
  schema?: number;
  fields?: ProposalPropertiesBlockFields;
  parentId?: string;
  rootId?: string;
};

export type ProposalBlockUpdateInput = ProposalBlockInput & {
  id: string;
};

export type ProposalPropertyValue = string | string[];

export type ProposalPropertyValues = { properties: Record<string, ProposalPropertyValue> };

export type ProposalFields = { fields: ProposalPropertyValues };
