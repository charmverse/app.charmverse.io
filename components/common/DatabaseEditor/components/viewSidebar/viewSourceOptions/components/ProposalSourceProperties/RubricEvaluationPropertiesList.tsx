import { Divider, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

import { PropertySelector } from './PropertiesListSelector';
import type { SelectedProposalProperties } from './ProposalSourcePropertiesDialog';
import { SelectedPropertiesList } from './SelectedPropertiesList';

export function RubricEvaluationPropertiesList({
  selectedProperties,
  setSelectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
}) {
  const { proposalTemplates } = useProposalTemplates({
    detailed: true
  });
  const rubricEvaluationTitles = useMemo(() => {
    const _rubricEvaluationTitles: Set<string> = new Set(
      selectedProperties.rubricEvaluations.map((evaluation) => evaluation.title)
    );
    proposalTemplates?.forEach((template) => {
      template.evaluations?.forEach((evaluation) => {
        if (evaluation.type === 'rubric') {
          _rubricEvaluationTitles.add(evaluation.title);
        }
      });
    });
    return Array.from(_rubricEvaluationTitles);
  }, [proposalTemplates, selectedProperties.rubricEvaluations]);

  if (rubricEvaluationTitles.length === 0) {
    return <Typography>No rubric evaluations available</Typography>;
  }

  function updateRubricEvaluationProperties(evaluationTitle: string, updatedProperties: { [key: string]: boolean }) {
    const existingEvaluation = selectedProperties.rubricEvaluations.find(
      (evaluation) => evaluation.title === evaluationTitle
    );

    if (!existingEvaluation) {
      setSelectedProperties({
        ...selectedProperties,
        rubricEvaluations: [
          ...selectedProperties.rubricEvaluations,
          {
            title: evaluationTitle,
            ...updatedProperties
          }
        ]
      });
    } else {
      const updatedSelectedProperties = {
        ...selectedProperties,
        rubricEvaluations: selectedProperties.rubricEvaluations
          .map((rubricEvaluation) => {
            if (rubricEvaluation.title === evaluationTitle) {
              return {
                ...rubricEvaluation,
                ...updatedProperties
              };
            }
            return rubricEvaluation;
          })
          .filter((evaluation) => {
            const isAllPropertiesFalsy =
              !evaluation.average &&
              !evaluation.total &&
              !evaluation.reviewers &&
              !evaluation.criteriaTotal &&
              !evaluation.reviewerScore &&
              !evaluation.reviewerComment &&
              !evaluation.criteriaAverage;
            return !isAllPropertiesFalsy;
          })
      };
      setSelectedProperties(updatedSelectedProperties);
    }
  }

  return (
    <Stack gap={1}>
      {rubricEvaluationTitles.map((rubricEvaluationTitle) => {
        const _rubricEvaluation = selectedProperties?.rubricEvaluations.find(
          (evaluation) => evaluation.title === rubricEvaluationTitle
        );
        const isAllPropertiesSelected =
          _rubricEvaluation?.average &&
          _rubricEvaluation?.total &&
          _rubricEvaluation?.reviewers &&
          _rubricEvaluation?.criteriaTotal &&
          _rubricEvaluation?.reviewerScore &&
          _rubricEvaluation?.reviewerComment &&
          _rubricEvaluation?.criteriaAverage;

        return (
          <Stack key={rubricEvaluationTitle}>
            <PropertySelector
              isChecked={!!isAllPropertiesSelected}
              onClick={() => {
                if (isAllPropertiesSelected) {
                  setSelectedProperties({
                    ...selectedProperties,
                    rubricEvaluations: selectedProperties.rubricEvaluations.filter(
                      (evaluation) => evaluation.title !== rubricEvaluationTitle
                    )
                  });
                } else {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, {
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
              label={rubricEvaluationTitle}
              bold
            />
            <Stack ml={2}>
              <PropertySelector
                isChecked={!!_rubricEvaluation?.average}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, { average: !_rubricEvaluation?.average });
                }}
                label='Step Average'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.total}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, { total: !_rubricEvaluation?.total });
                }}
                label='Step Total'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.reviewers}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, { reviewers: !_rubricEvaluation?.reviewers });
                }}
                label='Step Reviewers'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.criteriaTotal}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, {
                    criteriaTotal: !_rubricEvaluation?.criteriaTotal
                  });
                }}
                label='Criteria Total (for each criteria)'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.criteriaAverage}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, {
                    criteriaAverage: !_rubricEvaluation?.criteriaAverage
                  });
                }}
                label='Criteria Average (for each criteria)'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.reviewerScore}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, {
                    reviewerScore: !_rubricEvaluation?.reviewerScore
                  });
                }}
                label='Individual Reviewer Scores'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.reviewerComment}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, {
                    reviewerComment: !_rubricEvaluation?.reviewerComment
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

export function RubricEvaluationPropertiesReadonlyList({
  selectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
}) {
  if (selectedProperties.rubricEvaluations.length === 0) {
    return null;
  }

  return (
    <Stack gap={1}>
      <Typography fontWeight='bold' variant='body2'>
        Proposal Rubric Evaluations
      </Typography>
      <Stack gap={2}>
        {selectedProperties.rubricEvaluations.map((rubricEvaluation) => {
          const items: string[] = [];
          if (rubricEvaluation.average) {
            items.push('Step Average');
          }
          if (rubricEvaluation.total) {
            items.push('Step Total');
          }
          if (rubricEvaluation.reviewers) {
            items.push('Step Reviewers');
          }
          if (rubricEvaluation.criteriaTotal) {
            items.push('Criteria Total');
          }
          if (rubricEvaluation.criteriaAverage) {
            items.push('Criteria Average');
          }
          if (rubricEvaluation.reviewerScore) {
            items.push('Individual Reviewer Scores');
          }
          if (rubricEvaluation.reviewerComment) {
            items.push('Individual Reviewer Comments');
          }

          if (items.length === 0) {
            return null;
          }
          return (
            <SelectedPropertiesList
              key={rubricEvaluation.title}
              items={items}
              title={rubricEvaluation.title}
              hideDivider
            />
          );
        })}
      </Stack>
      <Divider
        sx={{
          my: 2
        }}
      />
    </Stack>
  );
}
