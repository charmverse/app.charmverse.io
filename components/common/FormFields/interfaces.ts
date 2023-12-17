import type { ProposalFormField } from '@charmverse/core/prisma-client';

export type ProposalFormFieldInput = Pick<
  ProposalFormField,
  'description' | 'name' | 'index' | 'options' | 'required' | 'private' | 'type'
>;
