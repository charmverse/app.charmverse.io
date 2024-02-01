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
    proposalStep: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalStep'
    ),
    proposalStatus: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalStatus'
    ),
    proposalEvaluationType: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalEvaluationType'
    ),
    proposalAuthor: (boardBlock.fields as BoardFields).cardProperties.find(
      (prop: IPropertyTemplate) => prop.type === 'proposalAuthor'
    )
  };
}
