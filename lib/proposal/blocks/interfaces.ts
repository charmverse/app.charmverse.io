import type { ProposalBlock } from '@charmverse/core/prisma-client';

export type ProposalPropertyOption = { id: string; color: string; value: string };

export type ProposalPropertyField = { id: string; name: string; type: string; options: ProposalPropertyOption[] };

export type ProposalPropertiesBlockFields = {
  cardProperties: ProposalPropertyField[];
};
// Properties block with typed fields
export type ProposalPropertiesBlock = ProposalBlock & {
  fields: ProposalPropertiesBlockFields;
  type: 'board';
};

// TODO: Add other block types i.e. view.
export type ProposalBlockWithTypedFields = ProposalPropertiesBlock;

export type ProposalBlockInput = {
  id?: string;
  type: string;
  spaceId?: string;
  title?: string;
  schema?: number;
  fields?: ProposalPropertiesBlockFields;
  parentId?: string;
  rootId?: string;
};

export type ProposalBlockUpdateInput = ProposalBlockInput & {
  id: string;
};

export type ProposalPropertyValue = string | string[] | number;

export type ProposalPropertiesField = Record<string, ProposalPropertyValue>;

export type ProposalPropertyValues = { properties: ProposalPropertiesField };

export type ProposalFields = ProposalPropertyValues;

export type ProposalFieldsProp = { fields: ProposalFields };
