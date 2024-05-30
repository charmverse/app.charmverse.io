import { Stack, Checkbox, Typography, Divider } from '@mui/material';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';
import { isTruthy } from 'lib/utils/types';

import type { SelectedProperties } from './ProposalSourcePropertiesDialog';

export function TemplatePropertiesList({
  selectedProperties,
  setSelectedProperties,
  templatePageId
}: {
  selectedProperties: SelectedProperties;
  setSelectedProperties: (selectedProperties: SelectedProperties) => void;
  templatePageId: string;
}) {
  const { proposalTemplates } = useProposalTemplates();

  const { formFields, rubricEvaluations } = useMemo(() => {
    const proposalTemplate = proposalTemplates?.find((template) => template.pageId === templatePageId);
    return {
      formFields: [],
      rubricEvaluations: proposalTemplate
        ? proposalTemplate.evaluations.filter((evaluation) => evaluation.type === 'rubric')
        : []
    };
  }, [proposalTemplates, templatePageId]);

  if (rubricEvaluations.length === 0 && formFields.length === 0) {
    return <Typography>No properties available</Typography>;
  }

  const selectedTemplate = selectedProperties.templates.find((template) => template.pageId === templatePageId);

  function updateTemplateProperties(evaluationId: string, updatedProperties: { [key: string]: boolean }) {
    const selectedEvaluation = selectedTemplate?.rubricEvaluations.find((evaluation) => evaluation.id === evaluationId);
    if (!selectedEvaluation) {
      setSelectedProperties({
        ...selectedProperties,
        templates: selectedProperties.templates.map((template) => {
          if (template.pageId === templatePageId) {
            return {
              ...template,
              rubricEvaluations: [
                ...template.rubricEvaluations,
                {
                  id: evaluationId,
                  ...updatedProperties
                }
              ]
            };
          }
          return template;
        })
      });
    } else {
      setSelectedProperties({
        ...selectedProperties,
        templates: selectedProperties.templates
          .map((template) => {
            if (template.pageId === templatePageId) {
              const updatedRubricEvaluations = template.rubricEvaluations
                .map((evaluation) => {
                  if (evaluation.id === evaluationId) {
                    const newValue = {
                      ...evaluation,
                      ...updatedProperties
                    };

                    // If all properties are false, remove the evaluation
                    if (
                      newValue.average === false &&
                      newValue.total === false &&
                      newValue.reviewers === false &&
                      newValue.criteriaTotal === false
                    ) {
                      return null;
                    }

                    return {
                      ...evaluation,
                      ...updatedProperties
                    };
                  }
                  return evaluation;
                })
                .filter(isTruthy);

              if (updatedRubricEvaluations.length === 0) {
                return null;
              }
              return {
                ...template,
                rubricEvaluations: updatedRubricEvaluations
              };
            }
            return template;
          })
          .filter(isTruthy)
      });
    }
  }

  return (
    <Stack gap={1}>
      {rubricEvaluations.map((rubricEvaluation) => {
        const _rubricEvaluation = selectedTemplate?.rubricEvaluations.find(
          (evaluation) => evaluation.id === rubricEvaluation.id
        );
        const isAllPropertiesSelected =
          _rubricEvaluation?.average &&
          _rubricEvaluation?.total &&
          _rubricEvaluation?.reviewers &&
          _rubricEvaluation?.criteriaTotal;

        return (
          <Stack key={rubricEvaluation.id}>
            <Stack direction='row' alignItems='center'>
              <Checkbox
                size='small'
                checked={!!isAllPropertiesSelected}
                onChange={() => {
                  if (isAllPropertiesSelected) {
                    setSelectedProperties({
                      ...selectedProperties,
                      templates: selectedProperties.templates.map((template) => {
                        if (template.pageId === templatePageId) {
                          return {
                            ...template,
                            rubricEvaluations: template.rubricEvaluations.filter(
                              (evaluation) => evaluation.id !== rubricEvaluation.id
                            )
                          };
                        }
                        return template;
                      })
                    });
                  } else {
                    updateTemplateProperties(rubricEvaluation.id, {
                      average: true,
                      total: true,
                      reviewers: true,
                      criteriaTotal: true
                    });
                  }
                }}
              />
              <Typography fontWeight='bold'>{rubricEvaluation.title}</Typography>
            </Stack>
            <Stack ml={2}>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.average}
                  onChange={() => {
                    updateTemplateProperties(rubricEvaluation.id, { average: !_rubricEvaluation?.average });
                  }}
                />
                <Typography>Average</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.total}
                  onChange={() => {
                    updateTemplateProperties(rubricEvaluation.id, { total: !_rubricEvaluation?.total });
                  }}
                />
                <Typography>Total</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.reviewers}
                  onChange={() => {
                    updateTemplateProperties(rubricEvaluation.id, { reviewers: !_rubricEvaluation?.reviewers });
                  }}
                />
                <Typography>Reviewers</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.criteriaTotal}
                  onChange={() => {
                    updateTemplateProperties(rubricEvaluation.id, {
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

export function TemplatePropertiesReadonlyList({ selectedProperties }: { selectedProperties: SelectedProperties }) {
  const { proposalTemplates } = useProposalTemplates();

  if (
    selectedProperties.templates.length === 0 ||
    selectedProperties.templates.every(
      (template) => template.rubricEvaluations.length === 0 && template.formFields.length === 0
    )
  ) {
    return null;
  }

  return (
    <>
      <Stack gap={1}>
        {selectedProperties.templates.map((template) => {
          const selectedTemplate = proposalTemplates?.find((proposal) => proposal.pageId === template.pageId);

          if (!selectedTemplate) {
            return null;
          }

          return (
            <Stack gap={1} key={template.pageId}>
              <Typography fontWeight='bold' variant='subtitle1'>
                {selectedTemplate.title}
              </Typography>
              {template.rubricEvaluations.map((rubricEvaluation) => {
                const _rubricEvaluation = selectedTemplate.evaluations.find(
                  (evaluation) => evaluation.id === rubricEvaluation.id
                );
                if (!_rubricEvaluation) {
                  return null;
                }
                return (
                  <Stack key={rubricEvaluation.id}>
                    <Typography fontWeight='bold' variant='subtitle2'>
                      {_rubricEvaluation.title}
                    </Typography>
                    <Stack gap={0.5} ml={2} mt={0.5}>
                      {rubricEvaluation.average && <Typography variant='subtitle2'>Average</Typography>}
                      {rubricEvaluation.total && <Typography variant='subtitle2'>Total</Typography>}
                      {rubricEvaluation.reviewers && <Typography variant='subtitle2'>Reviewers</Typography>}
                      {rubricEvaluation.criteriaTotal && <Typography variant='subtitle2'>Criteria total</Typography>}
                    </Stack>
                  </Stack>
                );
              })}
            </Stack>
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
