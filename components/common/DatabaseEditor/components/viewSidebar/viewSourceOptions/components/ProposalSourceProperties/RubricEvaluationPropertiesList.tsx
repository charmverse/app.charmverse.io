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
  const { proposalTemplates } = useProposalTemplates();
  const rubricEvaluationTitles = useMemo(() => {
    const _rubricEvaluationTitles: Set<string> = new Set();
    proposalTemplates?.forEach((template) => {
      template.evaluations.forEach((evaluation) => {
        if (evaluation.type === 'rubric') {
          _rubricEvaluationTitles.add(evaluation.title);
        }
      });
    });
    return Array.from(_rubricEvaluationTitles);
  }, [proposalTemplates]);

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
              !evaluation.average && !evaluation.total && !evaluation.reviewers && !evaluation.criteriaTotal;
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
          _rubricEvaluation?.criteriaTotal;

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
                    criteriaTotal: true
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
                label='Average'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.total}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, { total: !_rubricEvaluation?.total });
                }}
                label='Total'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.reviewers}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, { reviewers: !_rubricEvaluation?.reviewers });
                }}
                label='Reviewers'
              />
              <PropertySelector
                isChecked={!!_rubricEvaluation?.criteriaTotal}
                onClick={() => {
                  updateRubricEvaluationProperties(rubricEvaluationTitle, {
                    criteriaTotal: !_rubricEvaluation?.criteriaTotal
                  });
                }}
                label='Criteria total'
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
    <>
      <Stack gap={2}>
        {selectedProperties.rubricEvaluations.map((rubricEvaluation) => {
          const items: string[] = [];
          if (rubricEvaluation.average) {
            items.push('Average');
          }
          if (rubricEvaluation.total) {
            items.push('Total');
          }
          if (rubricEvaluation.reviewers) {
            items.push('Reviewers');
          }
          if (rubricEvaluation.criteriaTotal) {
            items.push('Criteria total');
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
    </>
  );
}
