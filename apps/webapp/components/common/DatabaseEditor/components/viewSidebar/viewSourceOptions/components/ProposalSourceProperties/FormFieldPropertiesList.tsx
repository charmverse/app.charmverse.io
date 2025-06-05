import { Stack, Typography } from '@mui/material';
import type { SelectedProposalProperties } from '@packages/databases/proposalsSource/interfaces';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

import { PropertySelector } from './PropertiesListSelector';

export function FormFieldPropertiesList({
  selectedProperties,
  setSelectedProperties,
  templateId
}: {
  templateId: string;
  selectedProperties: SelectedProposalProperties;
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
}) {
  const { proposalTemplates } = useProposalTemplates({ detailed: true });
  const formFields = useMemo(() => {
    const proposalTemplate = proposalTemplates?.find((template) => template.pageId === templateId);
    return (
      proposalTemplate?.formFields?.filter(
        (formField) => formField.type !== 'project_profile' && formField.type !== 'label'
      ) || []
    );
  }, [proposalTemplates, templateId]);

  if (formFields.length === 0) {
    return <Typography>No form fields available</Typography>;
  }

  const selectedTemplateProperties = selectedProperties.templateProperties.find(
    (templateProperty) => templateProperty.templateId === templateId
  );

  const selectedFormFields = selectedTemplateProperties?.formFields ?? [];

  const templateProperties = selectedProperties.templateProperties.find(
    (templateProperty) => templateProperty.templateId === templateId
  );

  return (
    <Stack gap={0.5}>
      <PropertySelector
        isChecked={selectedFormFields.length === formFields.length}
        label='Select All'
        bold
        onClick={() => {
          if (!templateProperties) {
            setSelectedProperties({
              ...selectedProperties,
              templateProperties: [
                ...selectedProperties.templateProperties,
                {
                  templateId,
                  formFields: formFields.map((formField) => formField.id),
                  rubricEvaluations: []
                }
              ]
            });
          } else {
            setSelectedProperties({
              ...selectedProperties,
              templateProperties: selectedProperties.templateProperties
                .map((templateProperty) => {
                  if (templateProperty.templateId === templateId) {
                    return {
                      ...templateProperty,
                      formFields:
                        selectedFormFields.length === formFields.length
                          ? []
                          : formFields.map((formField) => formField.id)
                    };
                  }
                  return templateProperty;
                })
                .filter(
                  (_templateProperties) =>
                    _templateProperties.formFields.length > 0 || _templateProperties.rubricEvaluations.length > 0
                )
            });
          }
        }}
      />
      <Stack ml={2} gap={0.5}>
        {formFields.map((formField) => {
          return (
            <PropertySelector
              key={formField.id}
              isChecked={selectedFormFields.includes(formField.id)}
              label={formField.name}
              onClick={() => {
                const isChecked = selectedFormFields.includes(formField.id);
                if (!templateProperties) {
                  setSelectedProperties({
                    ...selectedProperties,
                    templateProperties: [
                      ...selectedProperties.templateProperties,
                      {
                        templateId,
                        formFields: isChecked ? [] : [formField.id],
                        rubricEvaluations: []
                      }
                    ]
                  });
                  return;
                }
                setSelectedProperties({
                  ...selectedProperties,
                  templateProperties: selectedProperties.templateProperties
                    .map((templateProperty) => {
                      if (templateProperty.templateId === templateId) {
                        return {
                          ...templateProperty,
                          formFields: isChecked
                            ? templateProperty.formFields.filter((id) => id !== formField.id)
                            : [...templateProperty.formFields, formField.id]
                        };
                      }
                      return templateProperty;
                    })
                    .filter(
                      (_templateProperties) =>
                        _templateProperties.formFields.length > 0 || _templateProperties.rubricEvaluations.length > 0
                    )
                });
              }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}
