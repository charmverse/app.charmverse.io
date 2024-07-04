import { Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

import { PropertySelector } from './PropertiesListSelector';
import type { SelectedProposalProperties } from './ProposalSourcePropertiesDialog';

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

  function updateRubricEvaluationProperties(evaluationId: string, updatedProperties: { [key: string]: boolean }) {
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
                templateId,
                title: rubricEvaluation?.title || '',
                ...updatedProperties
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
                  ...updatedProperties
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
        templateProperties: selectedProperties.templateProperties.map((templateProperty) => {
          if (templateProperty.templateId !== templateId) {
            return templateProperty;
          }

          return {
            ...templateProperty,
            rubricEvaluations: templateProperty.rubricEvaluations.map((evaluation) =>
              evaluation.evaluationId === evaluationId ? { ...evaluation, ...updatedProperties } : evaluation
            )
          };
        })
      });
    }
  }

  return (
    <Stack gap={1}>
      {rubricEvaluations.map((rubricEvaluation) => {
        const rubricEvaluationProperty = proposalTemplateProperties?.rubricEvaluations.find(
          (evaluation) => evaluation.evaluationId === rubricEvaluation.id
        );

        const isAllPropertiesSelected =
          rubricEvaluationProperty?.average &&
          rubricEvaluationProperty?.total &&
          rubricEvaluationProperty?.reviewers &&
          rubricEvaluationProperty?.criteriaTotal &&
          rubricEvaluationProperty?.reviewerScore &&
          rubricEvaluationProperty?.reviewerComment &&
          rubricEvaluationProperty?.criteriaAverage;

        return (
          <Stack key={rubricEvaluation.id}>
            <PropertySelector
              isChecked={!!isAllPropertiesSelected}
              onClick={() => {
                if (isAllPropertiesSelected) {
                  setSelectedProperties({
                    ...selectedProperties,
                    templateProperties: selectedProperties.templateProperties.map((templateProperty) => {
                      if (templateProperty.templateId === templateId) {
                        return {
                          ...templateProperty,
                          rubricEvaluations: templateProperty.rubricEvaluations.filter(
                            (evaluation) => evaluation.evaluationId !== rubricEvaluation.id
                          )
                        };
                      }
                      return templateProperty;
                    })
                  });
                } else {
                  updateRubricEvaluationProperties(rubricEvaluation.id, {
                    average: true,
                    total: true,
                    reviewers: true,
                    criteriaTotal: true,
                    reviewerScore: true,
                    reviewerComment: true,
                    criteriaAverage: true
                  });
                }
              }}
              label={rubricEvaluation.title}
              bold
            />
            <Stack ml={2}>
              <PropertySelector
                isChecked={!!rubricEvaluationProperty?.average}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluation.id, {
                    average: !rubricEvaluationProperty?.average
                  });
                }}
                label='Step Average'
              />
              <PropertySelector
                isChecked={!!rubricEvaluationProperty?.total}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluation.id, { total: !rubricEvaluationProperty?.total });
                }}
                label='Step Total'
              />
              <PropertySelector
                isChecked={!!rubricEvaluationProperty?.reviewers}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluation.id, {
                    reviewers: !rubricEvaluationProperty?.reviewers
                  });
                }}
                label='Step Reviewers'
              />
              <PropertySelector
                isChecked={!!rubricEvaluationProperty?.criteriaTotal}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluation.id, {
                    criteriaTotal: !rubricEvaluationProperty?.criteriaTotal
                  });
                }}
                label='Criteria Total (for each criteria)'
              />
              <PropertySelector
                isChecked={!!rubricEvaluationProperty?.criteriaAverage}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluation.id, {
                    criteriaAverage: !rubricEvaluationProperty?.criteriaAverage
                  });
                }}
                label='Criteria Average (for each criteria)'
              />
              <PropertySelector
                isChecked={!!rubricEvaluationProperty?.reviewerScore}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluation.id, {
                    reviewerScore: !rubricEvaluationProperty?.reviewerScore
                  });
                }}
                label='Individual Reviewer Scores'
              />
              <PropertySelector
                isChecked={!!rubricEvaluationProperty?.reviewerComment}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluation.id, {
                    reviewerComment: !rubricEvaluationProperty?.reviewerComment
                  });
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
