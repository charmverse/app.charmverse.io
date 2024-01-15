import type { IPropertyTemplate } from './board';

export function addProposalEvaluationProperties({
  properties,
  rubricEvaluationTitles,
  filterEvaluationProperties = true
}: {
  filterEvaluationProperties?: boolean;
  rubricEvaluationTitles: string[];
  properties: IPropertyTemplate[];
}) {
  return [
    ...properties.filter((property) =>
      filterEvaluationProperties
        ? !['proposalEvaluatedBy', 'proposalEvaluationTotal', 'proposalEvaluationAverage'].includes(property.type)
        : true
    ),
    ...rubricEvaluationTitles
      .map(
        (title) =>
          [
            {
              id: `__proposalEvaluatedBy_${title}`,
              name: `${title} (Evaluation reviewers)`,
              type: 'proposalEvaluatedBy',
              options: []
            },
            {
              id: `__proposalEvaluationAverage_${title}`,
              name: `${title} (Evaluation average)`,
              type: 'proposalEvaluationAverage',
              options: []
            },
            {
              id: `__proposalEvaluationTotal_${title}`,
              name: `${title} (Evaluation total)`,
              type: 'proposalEvaluationTotal',
              options: []
            }
          ] as IPropertyTemplate[]
      )
      .flat()
  ] as IPropertyTemplate[];
}
