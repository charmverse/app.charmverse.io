import type { Prisma } from '@charmverse/core/prisma-client';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect } from 'react';
import type { FieldValues } from 'react-hook-form';
import { useForm } from 'react-hook-form';
import { isAddress } from 'viem';
import * as yup from 'yup';

import { isUUID, isUrl, isValidEmail } from 'lib/utilities/strings';

import type { FieldType } from '../interfaces';

export function useFormFields({
  fields,
  onSubmit
}: {
  fields: {
    value: any;
    id: string;
    required: boolean;
    type: FieldType;
  }[];
  onSubmit: (values: FieldValues) => void;
}) {
  const {
    control,
    formState: { isValid, errors, isDirty, isSubmitting },
    reset,
    getValues,
    setValue,
    handleSubmit,
    trigger
  } = useForm({
    mode: 'onChange',
    resolver: yupResolver(
      yup.object(
        fields.reduce((acc, property) => {
          const isRequired = property.required;
          switch (property.type) {
            case 'text':
            case 'text_multiline': {
              acc[property.id] = yup.string().test('is-required', 'Required', (value) => {
                return isRequired ? !!value : true;
              });
              break;
            }
            case 'date': {
              acc[property.id] = yup.string().test('is-date', 'Invalid date', (value) => {
                return isRequired ? (value ? !Number.isNaN(Date.parse(value)) : false) : true;
              });
              break;
            }
            case 'email': {
              acc[property.id] = yup.string().test('is-email', 'Invalid email', (value) => {
                return isRequired ? (value ? isValidEmail(value) : false) : true;
              });

              break;
            }
            case 'number': {
              acc[property.id] = yup.string().test('is-number', 'Invalid number', (value) => {
                return isRequired ? !Number.isNaN(value) : true;
              });
              break;
            }
            case 'label': {
              acc[property.id] = yup.string();
              break;
            }
            case 'select': {
              acc[property.id] = yup.string().test('is-uuid', 'Invalid uuid', (value) => {
                return isRequired ? (value ? isUUID(value) : false) : true;
              });
              break;
            }
            case 'person':
            case 'multiselect': {
              acc[property.id] = yup
                .array()
                .of(yup.string().uuid())
                .test('is-uuid', 'Invalid uuid', (value) => {
                  return isRequired ? (value ? value.every((v) => (v ? isUUID(v) : false)) : false) : true;
                });
              break;
            }
            case 'phone': {
              acc[property.id] = yup.string().test('is-phone', 'Invalid phone number', (value) => {
                return isRequired ? (value ? !!value.match(/^(0|[1-9]\d*)(\.\d+)?$/) : false) : true;
              });
              break;
            }
            case 'wallet': {
              acc[property.id] = yup.string().test('is-wallet', 'Invalid wallet address', (value) => {
                return isRequired ? (value ? isAddress(value) : false) : true;
              });
              break;
            }
            case 'url': {
              acc[property.id] = yup.string().test('is-url', 'Invalid url', (value) => {
                return isRequired ? (value ? isUrl(value) : false) : true;
              });
              break;
            }
            default: {
              return acc;
            }
          }

          return acc;
        }, {} as Record<string, any>)
      )
    )
  });

  const values = getValues();

  useEffect(() => {
    const defaultValues = fields.reduce<Record<string, string | string[]>>((acc, prop) => {
      acc[prop.id] =
        prop.type === 'multiselect' || prop.type === 'person'
          ? Array.isArray(prop.value)
            ? prop.value
            : []
          : prop.value ?? '';
      return acc;
    }, {});

    reset(defaultValues);
    trigger();
  }, [fields, reset, trigger]);

  function onFormChange(updatedFields: { id: string; value: string | string[] | Prisma.JsonValue }[]) {
    updatedFields.forEach((updatedField) => {
      setValue(updatedField.id, updatedField.value, {
        shouldDirty: true,
        shouldValidate: true,
        shouldTouch: true
      });
    });
  }

  return {
    values,
    control,
    isValid,
    errors,
    isDirty,
    setValue,
    getValues,
    isSubmitting,
    onSubmit: () => {
      if (isDirty && isValid) {
        return handleSubmit(async () => {
          onSubmit(values);
        })();
      }
    },
    onFormChange
  };
}
