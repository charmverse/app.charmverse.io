import type { ProposalFormField } from '@charmverse/core/prisma-client';

import type { SelectOptionType } from '../form/fields/Select/interfaces';

export type ProposalFormFieldInput = Pick<
  ProposalFormField,
  'description' | 'name' | 'index' | 'required' | 'private' | 'type'
> & {
  options?: SelectOptionType[];
};
