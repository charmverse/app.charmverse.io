import { Checkbox, Divider, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

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
            <Stack direction='row' alignItems='center'>
              <Checkbox
                size='small'
                checked={!!isAllPropertiesSelected}
                onChange={() => {
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
              />
              <Typography fontWeight='bold'>{rubricEvaluationTitle}</Typography>
            </Stack>
            <Stack ml={2}>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.average}
                  onChange={() => {
                    updateRubricEvaluationProperties(rubricEvaluationTitle, { average: !_rubricEvaluation?.average });
                  }}
                />
                <Typography>Average</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.total}
                  onChange={() => {
                    updateRubricEvaluationProperties(rubricEvaluationTitle, { total: !_rubricEvaluation?.total });
                  }}
                />
                <Typography>Total</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.reviewers}
                  onChange={() => {
                    updateRubricEvaluationProperties(rubricEvaluationTitle, {
                      reviewers: !_rubricEvaluation?.reviewers
                    });
                  }}
                />
                <Typography>Reviewers</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.criteriaTotal}
                  onChange={() => {
                    updateRubricEvaluationProperties(rubricEvaluationTitle, {
                      criteriaTotal: !_rubricEvaluation?.criteriaTotal
                    });
                  }}
                />
                <Typography>Criteria total</Typography>
              </Stack>
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
