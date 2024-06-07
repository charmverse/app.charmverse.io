import type { IPropertyTemplate } from './board';
import { getPropertyName as getPropertyNameFromProposalSource } from './proposalsSource/getBoardProperties';

export function getPropertyName(property: IPropertyTemplate) {
  return getPropertyNameFromProposalSource(property) ?? property.name;
}
