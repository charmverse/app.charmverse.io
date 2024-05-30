import { Checkbox, Divider, Stack, Typography } from '@mui/material';
import { useMemo } from 'react';

import { useProposalTemplates } from 'components/proposals/hooks/useProposalTemplates';

import type { SelectedProperties } from './ProposalSourcePropertiesDialog';

export function FormFieldPropertiesList({
  selectedProperties,
  setSelectedProperties,
  templatePageId
}: {
  templatePageId: string;
  selectedProperties: SelectedProperties;
  setSelectedProperties: (selectedProperties: SelectedProperties) => void;
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
      <Stack direction='row' alignItems='center'>
        <Checkbox
          size='small'
          checked={selectedProperties.formFields.length === formFields.length}
          onChange={() => {
            setSelectedProperties(
              selectedProperties.formFields.length === formFields.length
                ? {
                    ...selectedProperties,
                    formFields: []
                  }
                : {
                    ...selectedProperties,
                    formFields: formFields.map((formField) => formField.id)
                  }
            );
          }}
        />
        <Typography fontWeight='bold'>Form Fields</Typography>
      </Stack>
      <Stack ml={2}>
        {formFields.map((formField) => {
          const isSelected = selectedProperties.formFields.includes(formField.id);
          return (
            <Stack key={formField.id} direction='row' alignItems='center'>
              <Checkbox
                size='small'
                checked={isSelected}
                onChange={() => {
                  if (isSelected) {
                    setSelectedProperties({
                      ...selectedProperties,
                      formFields: selectedProperties.formFields.filter((id) => id !== formField.id)
                    });
                  } else {
                    setSelectedProperties({
                      ...selectedProperties,
                      formFields: [...selectedProperties.formFields, formField.id]
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
  );
}

export function FormFieldPropertiesReadonlyList({ selectedProperties }: { selectedProperties: SelectedProperties }) {
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
            <Stack key={proposalTemplateFormField.title}>
              <Typography fontWeight='bold' variant='subtitle1'>
                {proposalTemplateFormField.title}
              </Typography>
              <Stack mt={0.5} gap={0.5}>
                {proposalTemplateFormField.formFields.map((formField) => {
                  return (
                    <Typography variant='subtitle2' key={formField.id}>
                      {formField.name}
                    </Typography>
                  );
                })}
              </Stack>
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
