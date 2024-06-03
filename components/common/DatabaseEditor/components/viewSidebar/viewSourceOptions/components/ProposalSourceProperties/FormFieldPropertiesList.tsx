import { Divider, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

import { PropertySelector } from './PropertiesListSelector';
import type { SelectedProposalProperties } from './ProposalSourcePropertiesDialog';
import { SelectedPropertiesList } from './SelectedPropertiesList';

export function FormFieldPropertiesList({
  selectedProperties,
  setSelectedProperties,
  templatePageId
}: {
  templatePageId: string;
  selectedProperties: SelectedProposalProperties;
  setSelectedProperties: (selectedProperties: SelectedProposalProperties) => void;
}) {
  const { proposalTemplates } = useProposalTemplates();
  const formFields = useMemo(() => {
    const proposalTemplate = proposalTemplates?.find((template) => template.pageId === templatePageId);
    return (
      proposalTemplate?.formFields?.filter(
        (formField) => formField.type !== 'project_profile' && formField.type !== 'label'
      ) || []
    );
  }, [proposalTemplates, templatePageId]);

  if (formFields.length === 0) {
    return <Typography>No form fields available</Typography>;
  }

  return (
    <Stack>
      <PropertySelector
        isChecked={selectedProperties.formFields.length === formFields.length}
        label='Select All'
        bold
        onClick={() => {
          if (selectedProperties.formFields.length === formFields.length) {
            setSelectedProperties({
              ...selectedProperties,
              formFields: []
            });
          } else {
            setSelectedProperties({
              ...selectedProperties,
              formFields: formFields.map((formField) => formField.id)
            });
          }
        }}
      />
      <Stack ml={2}>
        {formFields.map((formField) => {
          return (
            <PropertySelector
              key={formField.id}
              isChecked={selectedProperties.formFields.includes(formField.id)}
              label={formField.name}
              onClick={() => {
                const isChecked = selectedProperties.formFields.includes(formField.id);
                setSelectedProperties({
                  ...selectedProperties,
                  formFields: isChecked
                    ? selectedProperties.formFields.filter((id) => id !== formField.id)
                    : [...selectedProperties.formFields, formField.id]
                });
              }}
            />
          );
        })}
      </Stack>
    </Stack>
  );
}

export function FormFieldPropertiesReadonlyList({
  selectedProperties
}: {
  selectedProperties: SelectedProposalProperties;
}) {
  const { proposalTemplates } = useProposalTemplates();
  const proposalTemplateFormFields = useMemo(() => {
    return (
      proposalTemplates
        ?.filter((template) => {
          return (
            !template.archived &&
            !template.draft &&
            template.formFields &&
            template.formFields.filter(
              (formField) => formField.type !== 'project_profile' && formField.type !== 'label'
            ).length
          );
        })
        .map((template) => {
          return {
            title: template.title,
            formFields: template.formFields
              ? template.formFields.filter((formField) => selectedProperties.formFields.includes(formField.id))
              : []
          };
        })
        .filter((template) => template.formFields.length) ?? []
    );
  }, [proposalTemplates, selectedProperties]);

  if (proposalTemplateFormFields.length === 0) {
    return null;
  }

  return (
    <>
      <Stack gap={2}>
        {proposalTemplateFormFields.map((proposalTemplateFormField) => {
          return (
            <SelectedPropertiesList
              items={proposalTemplateFormField.formFields.map((formField) => formField.name)}
              title={proposalTemplateFormField.title}
              key={proposalTemplateFormField.title}
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
