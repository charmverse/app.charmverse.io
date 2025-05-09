import { Divider, Stack, Typography } from '@mui/material';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

import type { RubricEvaluationProperty, SelectedProposalProperties } from './interfaces';
import { SelectedPropertiesList } from './SelectedPropertiesList';

const RubricPropertyLabel: Record<RubricEvaluationProperty, string> = {
  average: 'Step Average',
  total: 'Step Total',
  reviewers: 'Step Reviewers',
  criteriaTotal: 'Criteria Total',
  criteriaAverage: 'Criteria Average',
  reviewerScore: 'Individual Reviewer Scores',
  reviewerComment: 'Individual Reviewer Comments',
  reviewerAverage: 'Reviewer Average'
};

export function TemplatePropertiesReadonlyList({
  selectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
}) {
  const { proposalTemplates } = useProposalTemplates({
    detailed: true
  });

  if (selectedProperties.templateProperties.length === 0) {
    return null;
  }

  return (
    <Stack gap={1}>
      <Typography fontWeight='bold' variant='h6'>
        Template Properties
      </Typography>
      <Stack gap={2}>
        {selectedProperties.templateProperties.map((templateProperty) => {
          const proposalTemplate = proposalTemplates?.find(
            (template) => template.pageId === templateProperty.templateId
          );
          if (!proposalTemplate) {
            return null;
          }

          return (
            <Stack key={templateProperty.templateId} gap={1}>
              <Typography fontWeight='bold'>{proposalTemplate.title}</Typography>
              {templateProperty.formFields.length ? (
                <SelectedPropertiesList
                  items={
                    proposalTemplate.formFields
                      ?.filter((formField) => templateProperty.formFields.includes(formField.id))
                      .map((formField) => formField.name) ?? []
                  }
                  title='Form fields'
                  titleVariant='body2'
                  hideDivider
                />
              ) : null}

              {templateProperty.rubricEvaluations.map((rubricEvaluation) => (
                <Stack key={rubricEvaluation.evaluationId}>
                  <SelectedPropertiesList
                    items={rubricEvaluation.properties.map((property) => RubricPropertyLabel[property])}
                    title={rubricEvaluation.title}
                    titleVariant='body2'
                    hideDivider
                  />
                </Stack>
              ))}
            </Stack>
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
