import type { Block } from '@charmverse/core/prisma';

import type { DatabaseProposalPropertyType, IPropertyTemplate } from 'lib/focalboard/board';

export type ExtractedDatabaseProposalProperties = Partial<Record<DatabaseProposalPropertyType, IPropertyTemplate>>;

/**
 * Returns all proposal properties
 */
export function extractDatabaseProposalProperties({
  database
}: {
  database: Pick<Block, 'fields'>;
}): Partial<ExtractedDatabaseProposalProperties> {
  return {
    proposalCategory: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalCategory'
    ),
    proposalUrl: (database.fields as any).cardProperties.find((prop: IPropertyTemplate) => prop.type === 'proposalUrl'),
    proposalStatus: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalStatus'
    ),
    proposalEvaluatedBy: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalEvaluatedBy'
    ),
    proposalEvaluationAverage: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalEvaluationAverage'
    ),
    proposalEvaluationTotal: (database.fields as any).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalEvaluationTotal'
    )
  };
}
