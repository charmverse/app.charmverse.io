import type { FormFieldType } from '@charmverse/core/prisma-client';
import AddIcon from '@mui/icons-material/Add';
import { Stack } from '@mui/material';
import type { SelectOptionType } from '@root/lib/forms/interfaces';
import debounce from 'lodash/debounce';
import { useRef, useEffect, useState, useMemo } from 'react';
import { v4 } from 'uuid';

import { useUpdateProposalFormFields } from 'charmClient/hooks/proposals';
import type { FormFieldInput } from 'lib/forms/interfaces';
import { emptyDocument } from 'lib/prosemirror/constants';

import { Button } from '../Button';

import { FormField } from './FormField';

export function FormFieldsEditor({
  proposalId,
  expandFieldsByDefault,
  formFields: initialFormFields,
  readOnly
}: {
  proposalId: string;
  expandFieldsByDefault?: boolean;
  formFields: FormFieldInput[];
  readOnly?: boolean;
}) {
  const [formFields, setFormFields] = useState([...initialFormFields]);
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<string[]>(
    expandFieldsByDefault ? [] : formFields.map((field) => field.id)
  );
  const { trigger } = useUpdateProposalFormFields({ proposalId });
  const debouncedUpdate = useMemo(() => {
    return debounce(trigger, 200);
  }, [trigger]);

  async function updateFormFields(_formFields: FormFieldInput[]) {
    if (readOnly) {
      return;
    }
    setFormFields(_formFields);
    try {
      await debouncedUpdate({ formFields: _formFields });
    } catch (error) {
      // dont show error modal, the UI should show red borders now instead
    }
  }

  return (
    <ControlledFormFieldsEditor
      collapsedFieldIds={collapsedFieldIds}
      formFields={formFields}
      setFormFields={updateFormFields}
      toggleCollapse={(fieldId) => {
        if (collapsedFieldIds.includes(fieldId)) {
          setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
        } else {
          setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
        }
      }}
      readOnly={readOnly}
    />
  );
}

export function ControlledFormFieldsEditor({
  formFields,
  setFormFields,
  collapsedFieldIds,
  toggleCollapse,
  readOnly
}: {
  formFields: FormFieldInput[];
  setFormFields: (updatedFormFields: FormFieldInput[]) => void;
  collapsedFieldIds: string[];
  toggleCollapse: (fieldId: string) => void;
  readOnly?: boolean;
}) {
  // Using a ref to keep the formFields state updated, since it becomes stale inside the functions
  const formFieldsRef = useRef(formFields);
  const lastInsertedIndexRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    formFieldsRef.current = formFields;
  }, [formFields]);

  function updateFormField(
    updatedFormField: Partial<
      FormFieldInput & {
        isOpen: boolean;
      }
    > & {
      id: string;
    }
  ) {
    const newFormFields = [...formFieldsRef.current];
    const updatedFieldIndex = newFormFields.findIndex((f) => f.id === updatedFormField.id);
    const newIndex = updatedFormField.index;
    // If the index was changed, we need to move the form field to the new index
    if (typeof newIndex === 'number') {
      newFormFields.splice(newIndex, 0, newFormFields.splice(updatedFieldIndex, 1)[0]);
    }

    // Making sure that the label field is not required
    if (updatedFormField.type === 'label') {
      updatedFormField.required = false;
    }

    setFormFields(
      newFormFields.map((formField, index) => ({
        ...formField,
        ...(index === (newIndex ?? updatedFieldIndex) ? updatedFormField : {}),
        index
      }))
    );
  }

  function addNewFormField() {
    const fieldId = v4();
    setFormFields([
      ...formFields,
      {
        type: 'short_text',
        name: '',
        description: emptyDocument,
        index: formFields.length,
        options: [],
        private: false,
        required: true,
        id: fieldId,
        fieldConfig: null
      }
    ]);

    lastInsertedIndexRef.current = formFields.length;
  }

  useEffect(() => {
    // reset last inserted index after render
    lastInsertedIndexRef.current = undefined;
  });

  function duplicateFormField(fieldId: string) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    newFormFields.splice(index, 0, {
      ...newFormFields[index],
      id: v4(),
      index: index + 1,
      options: newFormFields[index].options?.map((option) => ({ ...option, id: v4() })) ?? []
    });

    setFormFields(
      newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }))
    );
  }

  function deleteFormField(fieldId: string) {
    const newFormFields = formFields.filter((field) => field.id !== fieldId);
    setFormFields(
      newFormFields.map((formField, i) => ({
        ...formField,
        index: i
      }))
    );
  }

  function onCreateOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    options.push(option);
    setFormFields(newFormFields);
  }

  function onDeleteOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    const newOptions = options.filter((o) => o.id !== option.id);
    newFormFields[index].options = newOptions;
    setFormFields(newFormFields);
  }

  function onUpdateOption(fieldId: string, option: SelectOptionType) {
    const index = formFields.findIndex((f) => f.id === fieldId);
    const newFormFields = [...formFields];
    const options = newFormFields[index].options ?? [];
    const newOptions = options.map((o) => {
      if (o.id === option.id) {
        return option;
      }
      return o;
    });
    newFormFields[index].options = newOptions;
    setFormFields(newFormFields);
  }

  const formFieldTypeFrequencyCount = formFields.reduce(
    (acc, formField) => {
      if (formField.type in acc) {
        acc[formField.type] += 1;
      } else {
        acc[formField.type] = 1;
      }
      return acc;
    },
    {} as Record<FormFieldType, number>
  );

  return (
    <Stack gap={1}>
      {formFields.map((formField) => (
        <FormField
          formFieldTypeFrequencyCount={formFieldTypeFrequencyCount}
          readOnly={readOnly}
          toggleOpen={() => {
            toggleCollapse(formField.id);
          }}
          isOpen={!collapsedFieldIds.includes(formField.id)}
          formField={formField}
          updateFormField={(updatedFormField) => {
            updateFormField(updatedFormField);
          }}
          key={formField.id}
          onDuplicate={() => duplicateFormField(formField.id)}
          onDelete={() => deleteFormField(formField.id)}
          onCreateOption={(option) => {
            onCreateOption(formField.id, option);
          }}
          onDeleteOption={(option) => {
            onDeleteOption(formField.id, option);
          }}
          onUpdateOption={(option) => {
            onUpdateOption(formField.id, option);
          }}
          forceFocus={lastInsertedIndexRef.current === formField.index}
        />
      ))}
      {!readOnly && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          startIcon={<AddIcon fontSize='small' />}
          variant='text'
          size='small'
          color='secondary'
          data-test='add-new-form-field-button'
          onClick={addNewFormField}
        >
          Add an input
        </Button>
      )}
    </Stack>
  );
}
