import { yupResolver } from '@hookform/resolvers/yup';
import type { FormFieldValue } from '@root/lib/proposals/forms/interfaces';
import { useCallback, useEffect } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';

import type { FormFieldInput } from './formFieldSchema';
import { getYupValidationSchema, getFormFieldMap } from './formFieldSchema';

export function useFormFields({
  fields,
  onSubmit
}: {
  fields?: FormFieldInput[];
  onSubmit?: (values: FieldValues) => void;
}) {
  const { control, getFieldState, handleSubmit, reset } = useForm({
    mode: 'onChange',
    defaultValues: getFormFieldMap(fields || []),
    resolver: getFormResolver(fields || [])
  });

  useEffect(() => {
    // set form values once fields are defined
    if (fields) {
      reset(getFormFieldMap(fields), {
        keepDirty: false,
        keepDirtyValues: false
      });
    }
  }, [!!fields, reset]);

  return {
    control,
    getFieldState,
    reset,
    onSubmit: () => {
      handleSubmit((_values) => {
        onSubmit?.(_values);
        // Reset dirty state after submit
        reset(_values, {
          keepDirty: false,
          keepDirtyValues: false
        });
      })();
    }
  };
}

/*
 * @deprecated - this hook is slow because it subscribes to formState at the root of the form
 */
export function useFormFieldsWithState({
  fields,
  onSubmit
}: {
  fields?: FormFieldInput[];
  onSubmit?: (values: FieldValues) => void;
}) {
  const { control, formState, setValue, handleSubmit, reset } = useForm({
    mode: 'onChange',
    defaultValues: getFormFieldMap(fields || []),
    resolver: getFormResolver(fields || [])
  });

  const onFormChange = useCallback(
    (updatedFields: { id: string; value: FormFieldValue }[]) => {
      updatedFields.forEach((updatedField) => {
        setValue(updatedField.id, updatedField.value, {
          shouldDirty: true,
          shouldValidate: true,
          shouldTouch: true
        });
      });
    },
    [setValue]
  );

  useEffect(() => {
    // set form values once fields are defined
    if (fields) {
      reset(getFormFieldMap(fields), {
        keepDirty: false,
        keepDirtyValues: false
      });
    }
  }, [!!fields, reset]);

  return {
    control,
    formState,
    setValue,
    onSubmit: () => {
      if (!formState.isValid) {
        throw new Error('Form is not valid to submit');
      }
      handleSubmit((_values) => {
        onSubmit?.(_values);
        // Reset dirty state after submit
        reset(_values, {
          keepDirty: false,
          keepDirtyValues: false
        });
      })();
    },
    onFormChange
  };
}

function getFormResolver(fields: FormFieldInput[]) {
  return yupResolver(getYupValidationSchema(fields));
}
