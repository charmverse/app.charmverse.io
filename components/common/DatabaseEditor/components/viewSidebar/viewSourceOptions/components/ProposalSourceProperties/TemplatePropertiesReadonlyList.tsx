import { Stack, Typography } from '@mui/material';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

import type { SelectedProposalProperties } from './ProposalSourcePropertiesDialog';
import { SelectedPropertiesList } from './SelectedPropertiesList';

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
      <Typography fontWeight='bold'>Template Properties</Typography>
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
              <Typography fontWeight='bold' variant='body2'>
                {proposalTemplate.title}
              </Typography>
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

              {templateProperty.rubricEvaluations.map((rubricEvaluation) => {
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
                return (
                  <Stack key={rubricEvaluation.templateId}>
                    <SelectedPropertiesList
                      items={items}
                      title={rubricEvaluation.title}
                      titleVariant='body2'
                      hideDivider
                    />
                  </Stack>
                );
              })}
            </Stack>
          );
        })}
      </Stack>
    </Stack>
  );
}
