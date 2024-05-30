import { Stack, Checkbox, Typography, Divider } from '@mui/material';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

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
      rubricEvaluations: proposalTemplate
        ? proposalTemplate.evaluations.filter((evaluation) => evaluation.type === 'rubric')
        : [],
      formFields:
        proposalTemplate?.formFields?.filter(
          (formField) => formField.type !== 'project_profile' && formField.type !== 'label'
        ) ?? []
    };
  }, [proposalTemplates, templatePageId]);

  if (rubricEvaluations.length === 0 && formFields.length === 0) {
    return <Typography>No properties available</Typography>;
  }

  const selectedTemplate = selectedProperties.templates.find((template) => template.pageId === templatePageId);

  function updateRubricEvaluationProperties(evaluationId: string, updatedProperties: { [key: string]: boolean }) {
    if (!selectedTemplate) {
      setSelectedProperties({
        ...selectedProperties,
        templates: [
          ...selectedProperties.templates,
          {
            formFields: [],
            pageId: templatePageId,
            rubricEvaluations: [
              {
                id: evaluationId,
                ...updatedProperties
              }
            ]
          }
        ]
      });
    } else {
      const updatedSelectedProperties = {
        ...selectedProperties,
        templates: selectedProperties.templates
          .map((template) => {
            if (template.pageId === templatePageId) {
              const selectedEvaluation = template.rubricEvaluations.find(
                (evaluation) => evaluation.id === evaluationId
              );
              return {
                ...template,
                rubricEvaluations: (selectedEvaluation
                  ? template.rubricEvaluations.map((evaluation) => {
                      if (evaluation.id === evaluationId) {
                        return {
                          ...evaluation,
                          ...updatedProperties
                        };
                      }
                      return evaluation;
                    })
                  : [
                      ...template.rubricEvaluations,
                      {
                        id: evaluationId,
                        ...updatedProperties
                      }
                    ]
                ).filter((evaluation) => {
                  const isAllPropertiesFalsy =
                    !evaluation.average && !evaluation.total && !evaluation.reviewers && !evaluation.criteriaTotal;
                  return !isAllPropertiesFalsy;
                })
              };
            }
            return template;
          })
          .filter((template) => template.rubricEvaluations.length || template.formFields.length)
      };
      setSelectedProperties(updatedSelectedProperties);
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
                      templates: selectedProperties.templates
                        .map((template) => {
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
                        .filter((template) => template.rubricEvaluations.length || template.formFields.length)
                    });
                  } else {
                    updateRubricEvaluationProperties(rubricEvaluation.id, {
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
                    updateRubricEvaluationProperties(rubricEvaluation.id, { average: !_rubricEvaluation?.average });
                  }}
                />
                <Typography>Average</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.total}
                  onChange={() => {
                    updateRubricEvaluationProperties(rubricEvaluation.id, { total: !_rubricEvaluation?.total });
                  }}
                />
                <Typography>Total</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.reviewers}
                  onChange={() => {
                    updateRubricEvaluationProperties(rubricEvaluation.id, { reviewers: !_rubricEvaluation?.reviewers });
                  }}
                />
                <Typography>Reviewers</Typography>
              </Stack>
              <Stack direction='row' alignItems='center'>
                <Checkbox
                  size='small'
                  checked={!!_rubricEvaluation?.criteriaTotal}
                  onChange={() => {
                    updateRubricEvaluationProperties(rubricEvaluation.id, {
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
      {formFields.length ? (
        <Stack>
          <Stack direction='row' alignItems='center'>
            <Checkbox
              size='small'
              checked={selectedTemplate?.formFields.length === formFields.length}
              onChange={() => {
                setSelectedProperties({
                  ...selectedProperties,
                  templates: selectedProperties.templates
                    .map((template) => {
                      if (template.pageId === templatePageId) {
                        return {
                          ...template,
                          formFields:
                            template.formFields.length === formFields.length ? [] : formFields.map((field) => field.id)
                        };
                      }
                      return template;
                    })
                    .filter((template) => template.rubricEvaluations.length || template.formFields.length)
                });
              }}
            />
            <Typography fontWeight='bold'>Form fields</Typography>
          </Stack>
          <Stack ml={2}>
            {formFields.map((formField) => {
              const isFormFieldSelected = !!selectedTemplate?.formFields.some((fieldId) => fieldId === formField.id);
              return (
                <Stack direction='row' alignItems='center' key={formField.id}>
                  <Checkbox
                    size='small'
                    checked={isFormFieldSelected}
                    onChange={() => {
                      if (!selectedTemplate) {
                        setSelectedProperties({
                          ...selectedProperties,
                          templates: [
                            ...selectedProperties.templates,
                            {
                              formFields: [formField.id],
                              pageId: templatePageId,
                              rubricEvaluations: []
                            }
                          ]
                        });
                      } else {
                        setSelectedProperties({
                          ...selectedProperties,
                          templates: selectedProperties.templates
                            .map((template) => {
                              if (template.pageId === templatePageId) {
                                return {
                                  ...template,
                                  formFields: isFormFieldSelected
                                    ? template.formFields.filter((fieldId) => fieldId !== formField.id)
                                    : [...template.formFields, formField.id]
                                };
                              }
                              return template;
                            })
                            .filter((template) => template.rubricEvaluations.length || template.formFields.length)
                        });
                      }
                    }}
                  />
                  <Typography>{formField.name}</Typography>
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      ) : null}
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
              {template.rubricEvaluations.length ? (
                <Stack gap={1}>
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
                          {rubricEvaluation.criteriaTotal && (
                            <Typography variant='subtitle2'>Criteria total</Typography>
                          )}
                        </Stack>
                      </Stack>
                    );
                  })}
                </Stack>
              ) : null}
              {template.formFields.length ? (
                <Stack>
                  <Typography fontWeight='bold' variant='subtitle2'>
                    Form fields
                  </Typography>
                  <Stack ml={2}>
                    <Stack key={template.pageId} gap={0.5} mt={0.5}>
                      {template.formFields.map((formFieldId) => {
                        const formField = selectedTemplate.formFields?.find((field) => field.id === formFieldId);
                        if (!formField) {
                          return null;
                        }
                        return (
                          <Typography key={formFieldId} variant='subtitle2'>
                            {formField?.name}
                          </Typography>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Stack>
              ) : null}
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
