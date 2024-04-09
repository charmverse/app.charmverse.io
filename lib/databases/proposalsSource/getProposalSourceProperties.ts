import type { IPropertyTemplate, ProposalPropertyType } from 'lib/databases/board';

export type ProposalPropertiesMap = Partial<Record<ProposalPropertyType, IPropertyTemplate>>;

/**
 * Returns all proposal properties
 */
export function getProposalSourceProperties({
  cardProperties
}: {
  cardProperties: IPropertyTemplate[];
}): Partial<ProposalPropertiesMap> {
  return {
    proposalUrl: cardProperties.find((prop) => prop.type === 'proposalUrl'),
    proposalStep: cardProperties.find((prop) => prop.type === 'proposalStep'),
    proposalStatus: cardProperties.find((prop) => prop.type === 'proposalStatus'),
    proposalEvaluationType: cardProperties.find((prop) => prop.type === 'proposalEvaluationType'),
    proposalAuthor: cardProperties.find((prop) => prop.type === 'proposalAuthor')
  };
}
