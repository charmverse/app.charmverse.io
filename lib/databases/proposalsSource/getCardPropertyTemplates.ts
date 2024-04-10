import type { IPropertyTemplate, ProposalPropertyType } from 'lib/databases/board';

export type ProposalPropertiesMap = Partial<Record<ProposalPropertyType, IPropertyTemplate>>;

/**
 * Returns all proposal properties
 */
export function getCardPropertyTemplates({
  cardProperties
}: {
  cardProperties: IPropertyTemplate[];
}): Partial<ProposalPropertiesMap> {
  return {
    proposalAuthor: cardProperties.find((prop) => prop.type === 'proposalAuthor'),
    proposalEvaluationType: cardProperties.find((prop) => prop.type === 'proposalEvaluationType'),
    proposalStatus: cardProperties.find((prop) => prop.type === 'proposalStatus'),
    proposalStep: cardProperties.find((prop) => prop.type === 'proposalStep'),
    proposalUrl: cardProperties.find((prop) => prop.type === 'proposalUrl')
  };
}
