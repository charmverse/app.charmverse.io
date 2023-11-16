import type { ProposalStatus } from '@charmverse/core/prisma-client';

import { PROPOSAL_STATUS_LABELS_WITH_ARCHIVED } from 'lib/proposal/proposalStatusTransition';

import type { IPropertyTemplate } from './board';

export function mapProposalStatusPropertyToDisplayValue({
  property
}: {
  property: IPropertyTemplate;
}): IPropertyTemplate {
  if (property.type !== 'proposalStatus') {
    return property;
  }

  return {
    ...property,
    options: property.options.map((opt) => ({
      ...opt,
      value: PROPOSAL_STATUS_LABELS_WITH_ARCHIVED[opt.value as Exclude<ProposalStatus, 'draft'> | 'archived']
    }))
  };
}

export function filterInternalProperties<T>(propertyMap: Record<string, any>): T {
  return Object.entries(propertyMap).reduce((acc, [key, value]) => {
    if (key.startsWith('__')) {
      return acc;
    }

    return { ...acc, [key]: value };
  }, {} as T);
}
