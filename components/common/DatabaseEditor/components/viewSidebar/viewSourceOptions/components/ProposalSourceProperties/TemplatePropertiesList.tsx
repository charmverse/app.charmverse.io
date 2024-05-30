import { Stack, Checkbox, Typography } from '@mui/material';
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
        templates: selectedProperties.templates.map((template) => {
          if (template.pageId === templatePageId) {
            return {
              ...template,
              rubricEvaluations: template.rubricEvaluations.map((evaluation) => {
                if (evaluation.id === evaluationId) {
                  return {
                    ...evaluation,
                    ...updatedProperties
                  };
                }
                return evaluation;
              })
            };
          }
          return template;
        })
      });
    }
  }

  return (
    <Stack>
      {rubricEvaluations.map((rubricEvaluation) => {
        const _rubricEvaluation = selectedTemplate?.rubricEvaluations.find(
          (evaluation) => evaluation.id === rubricEvaluation.id
        );
        const isAllPropertiesSelected =
          _rubricEvaluation?.average &&
          _rubricEvaluation?.total &&
          _rubricEvaluation?.reviewers &&
          _rubricEvaluation?.criteriasTotal;

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
                            rubricEvaluations: rubricEvaluations.filter(
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
                      criteriasTotal: true
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
                  checked={!!_rubricEvaluation?.criteriasTotal}
                  onChange={() => {
                    updateTemplateProperties(rubricEvaluation.id, {
                      criteriasTotal: !_rubricEvaluation?.criteriasTotal
                    });
                  }}
                />
                <Typography>Criterias total</Typography>
              </Stack>
            </Stack>
          </Stack>
        );
      })}
    </Stack>
  );
}
