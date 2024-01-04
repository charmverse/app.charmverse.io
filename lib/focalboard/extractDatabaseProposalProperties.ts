import type { BoardFields, DatabaseProposalPropertyType, IPropertyTemplate } from 'lib/focalboard/board';

export type ExtractedDatabaseProposalProperties = Partial<Record<DatabaseProposalPropertyType, IPropertyTemplate>>;

/**
 * Returns all proposal properties
 */
export function extractDatabaseProposalProperties({
  boardBlock
}: {
  boardBlock: { fields: any };
}): Partial<ExtractedDatabaseProposalProperties> {
  return {
    proposalUrl: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalUrl'
    ),
    proposalStatus: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalStatus'
    ),
    proposalEvaluatedBy: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalEvaluatedBy'
    ),
    proposalEvaluationAverage: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalEvaluationAverage'
    ),
    proposalEvaluationTotal: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalEvaluationTotal'
    )
  };
}
