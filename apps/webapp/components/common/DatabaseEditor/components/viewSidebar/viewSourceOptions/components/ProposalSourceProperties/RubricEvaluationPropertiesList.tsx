import { Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

import type { RubricEvaluationProperty, SelectedProposalProperties } from './interfaces';
import { PropertySelector } from './PropertiesListSelector';

export function RubricEvaluationPropertiesList({
  selectedProperties,
  setSelectedProperties,
  templateId
}: {
  templateId: string;
  selectedProperties: SelectedProposalProperties;
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
}) {
  const { proposalTemplates } = useProposalTemplates({
    detailed: true
  });

  const { rubricEvaluations, proposalTemplateProperties } = useMemo(() => {
    const proposalTemplate = proposalTemplates?.find((template) => template.pageId === templateId);
    return {
      rubricEvaluations: proposalTemplate?.evaluations?.filter((evaluation) => evaluation.type === 'rubric') || [],
      proposalTemplateProperties: selectedProperties.templateProperties.find(
        (templateProperty) => templateProperty.templateId === templateId
      )
    };
  }, [proposalTemplates, templateId, selectedProperties]);

  if (rubricEvaluations.length === 0) {
    return <Typography>No rubric evaluations available</Typography>;
  }

  function updateRubricEvaluationProperties(evaluationId: string, updatedProperties: RubricEvaluationProperty[]) {
    const rubricEvaluationProperty = proposalTemplateProperties?.rubricEvaluations.find(
      (evaluation) => evaluation.evaluationId === evaluationId
    );
    const rubricEvaluation = rubricEvaluations.find((evaluation) => evaluation.id === evaluationId);

    if (!proposalTemplateProperties) {
      setSelectedProperties({
        ...selectedProperties,
        templateProperties: [
          ...selectedProperties.templateProperties,
          {
            templateId,
            formFields: [],
            rubricEvaluations: [
              {
                evaluationId,
                title: rubricEvaluation?.title || '',
                properties: updatedProperties
              }
            ]
          }
        ]
      });
    } else if (!rubricEvaluationProperty) {
      setSelectedProperties({
        ...selectedProperties,
        templateProperties: selectedProperties.templateProperties.map((templateProperty) => {
          if (templateProperty.templateId === templateId) {
            return {
              ...templateProperty,
              rubricEvaluations: [
                ...templateProperty.rubricEvaluations,
                {
                  evaluationId,
                  templateId,
                  title: rubricEvaluation?.title || '',
                  properties: updatedProperties
                }
              ]
            };
          }

          return templateProperty;
        })
      });
    } else {
      setSelectedProperties({
        ...selectedProperties,
        templateProperties: selectedProperties.templateProperties
          .map((templateProperty) => {
            if (templateProperty.templateId !== templateId) {
              return templateProperty;
            }

            return {
              ...templateProperty,
              rubricEvaluations: templateProperty.rubricEvaluations
                .map((evaluation) =>
                  evaluation.evaluationId === evaluationId
                    ? { ...evaluation, properties: updatedProperties }
                    : evaluation
                )
                .filter((evaluation) => evaluation.properties.length > 0)
            };
          })
          .filter(
            (_templateProperties) =>
              _templateProperties.formFields.length > 0 || _templateProperties.rubricEvaluations.length > 0
          )
      });
    }
  }

  return (
    <Stack gap={1}>
      {rubricEvaluations.map((rubricEvaluation) => {
        const rubricEvaluationProperty = proposalTemplateProperties?.rubricEvaluations.find(
          (evaluation) => evaluation.evaluationId === rubricEvaluation.id
        );

        const rubricEvaluationProperties = rubricEvaluationProperty?.properties ?? [];
        const isAllPropertiesSelected = [
          'average',
          'total',
          'reviewers',
          'criteriaTotal',
          'reviewerScore',
          'reviewerComment',
          'criteriaAverage',
          'reviewerAverage'
        ].every((property) => rubricEvaluationProperties.includes(property as RubricEvaluationProperty));

        return (
          <Stack key={rubricEvaluation.id}>
            <PropertySelector
              isChecked={!!isAllPropertiesSelected}
              onClick={() => {
                if (isAllPropertiesSelected) {
                  setSelectedProperties({
                    ...selectedProperties,
                    templateProperties: selectedProperties.templateProperties
                      .map((templateProperty) => {
                        if (templateProperty.templateId === templateId) {
                          return {
                            ...templateProperty,
                            rubricEvaluations: templateProperty.rubricEvaluations
                              .filter((evaluation) => evaluation.evaluationId !== rubricEvaluation.id)
                              .filter((evaluation) => evaluation.properties.length > 0)
                          };
                        }
                        return templateProperty;
                      })
                      .filter(
                        (_templateProperties) =>
                          _templateProperties.formFields.length > 0 || _templateProperties.rubricEvaluations.length > 0
                      )
                  });
                } else {
                  updateRubricEvaluationProperties(rubricEvaluation.id, [
                    'average',
                    'total',
                    'reviewers',
                    'criteriaTotal',
                    'reviewerScore',
                    'reviewerComment',
                    'criteriaAverage',
                    'reviewerAverage'
                  ]);
                }
              }}
              label={rubricEvaluation.title}
              bold
            />
            <Stack ml={2}>
              <PropertySelector
                isChecked={rubricEvaluationProperties.includes('average')}
                onClick={() => {
                  updateRubricEvaluationProperties(
                    rubricEvaluation.id,
                    rubricEvaluationProperties.includes('average')
                      ? rubricEvaluationProperties.filter((property) => property !== 'average')
                      : [...rubricEvaluationProperties, 'average']
                  );
                }}
                label='Step Average'
              />
              <PropertySelector
                isChecked={rubricEvaluationProperties.includes('reviewerAverage')}
                onClick={() => {
                  updateRubricEvaluationProperties(
                    rubricEvaluation.id,
                    rubricEvaluationProperties.includes('reviewerAverage')
                      ? rubricEvaluationProperties.filter((property) => property !== 'reviewerAverage')
                      : [...rubricEvaluationProperties, 'reviewerAverage']
                  );
                }}
                label='Step Reviewer Average'
              />
              <PropertySelector
                isChecked={rubricEvaluationProperties.includes('total')}
                onClick={() => {
                  updateRubricEvaluationProperties(
                    rubricEvaluation.id,
                    rubricEvaluationProperties.includes('total')
                      ? rubricEvaluationProperties.filter((property) => property !== 'total')
                      : [...rubricEvaluationProperties, 'total']
                  );
                }}
                label='Step Total'
              />
              <PropertySelector
                isChecked={rubricEvaluationProperties.includes('reviewers')}
                onClick={() => {
                  updateRubricEvaluationProperties(
                    rubricEvaluation.id,
                    rubricEvaluationProperties.includes('reviewers')
                      ? rubricEvaluationProperties.filter((property) => property !== 'reviewers')
                      : [...rubricEvaluationProperties, 'reviewers']
                  );
                }}
                label='Step Reviewers'
              />
              <PropertySelector
                isChecked={rubricEvaluationProperties.includes('criteriaTotal')}
                onClick={() => {
                  updateRubricEvaluationProperties(
                    rubricEvaluation.id,
                    rubricEvaluationProperties.includes('criteriaTotal')
                      ? rubricEvaluationProperties.filter((property) => property !== 'criteriaTotal')
                      : [...rubricEvaluationProperties, 'criteriaTotal']
                  );
                }}
                label='Criteria Total (for each criteria)'
              />
              <PropertySelector
                isChecked={rubricEvaluationProperties.includes('criteriaAverage')}
                onClick={() => {
                  updateRubricEvaluationProperties(
                    rubricEvaluation.id,
                    rubricEvaluationProperties.includes('criteriaAverage')
                      ? rubricEvaluationProperties.filter((property) => property !== 'criteriaAverage')
                      : [...rubricEvaluationProperties, 'criteriaAverage']
                  );
                }}
                label='Criteria Average (for each criteria)'
              />
              <PropertySelector
                isChecked={rubricEvaluationProperties.includes('reviewerScore')}
                onClick={() => {
                  updateRubricEvaluationProperties(
                    rubricEvaluation.id,
                    rubricEvaluationProperties.includes('reviewerScore')
                      ? rubricEvaluationProperties.filter((property) => property !== 'reviewerScore')
                      : [...rubricEvaluationProperties, 'reviewerScore']
                  );
                }}
                label='Individual Reviewer Scores'
              />
              <PropertySelector
                isChecked={rubricEvaluationProperties.includes('reviewerComment')}
                onClick={() => {
                  updateRubricEvaluationProperties(
                    rubricEvaluation.id,
                    rubricEvaluationProperties.includes('reviewerComment')
                      ? rubricEvaluationProperties.filter((property) => property !== 'reviewerComment')
                      : [...rubricEvaluationProperties, 'reviewerComment']
                  );
                }}
                label='Individual Reviewer Comments'
              />
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
