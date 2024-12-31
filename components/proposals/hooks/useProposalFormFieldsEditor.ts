import type { FormFieldInput } from '@root/lib/proposals/forms/interfaces';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useUpdateProposalFormFields } from 'charmClient/hooks/proposals';
import type { ControlledFormFieldsEditorProps } from 'components/common/form/FormFieldsEditor';

export function useProposalFormFieldsEditor({
  proposalId,
  expandFieldsByDefault,
  formFields: initialFormFields,
  readOnly
}: {
  proposalId?: string | null;
  expandFieldsByDefault?: boolean;
  formFields?: FormFieldInput[];
  readOnly: boolean;
}): Omit<ControlledFormFieldsEditorProps, 'evaluations'> {
  const [formFields, setFormFields] = useState<FormFieldInput[]>([]);
  const [collapsedFieldIds, setCollapsedFieldIds] = useState<string[]>([]);
  const { trigger } = useUpdateProposalFormFields({ proposalId });
  const debouncedUpdate = useMemo(() => {
    return debounce(trigger, 200);
  }, [trigger]);

  const setFormFieldsQuietly = useCallback(
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
    },
    [debouncedUpdate, readOnly]
  );

  const toggleCollapse = useCallback(
    (fieldId: string) => {
      if (collapsedFieldIds.includes(fieldId)) {
        setCollapsedFieldIds(collapsedFieldIds.filter((id) => id !== fieldId));
      } else {
        setCollapsedFieldIds([...collapsedFieldIds, fieldId]);
      }
    },
    [collapsedFieldIds, setCollapsedFieldIds]
  );

  useEffect(() => {
    if (initialFormFields) {
      setFormFields(initialFormFields);
      if (expandFieldsByDefault) {
        setCollapsedFieldIds([]);
      } else {
        setCollapsedFieldIds(initialFormFields.map((field) => field.id));
      }
    }
  }, [!!initialFormFields, expandFieldsByDefault]);

  return { readOnly, setFormFields: setFormFieldsQuietly, formFields, collapsedFieldIds, toggleCollapse };
}
