import { Stack } from '@mui/material';
import type { Control } from 'react-hook-form';
import { useController } from 'react-hook-form';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProjectFieldConfig, ProjectFieldProperty, ProjectValues } from '../interfaces';

function FieldAnswer<Values extends Record<string, any> = Record<string, any>>({
  property,
  fieldConfig,
  onChange,
  defaultRequired,
  control,
  name,
  disabled
}: {
  disabled?: boolean;
  name: string;
  control: Control<ProjectValues, any>;
  defaultRequired?: boolean;
  onChange?: (value: string) => void;
  property: ProjectFieldProperty<keyof Values & string>;
  fieldConfig?: ProjectFieldConfig<keyof Values & string>;
}) {
  const { field, fieldState } = useController({
    control,
    name: name as any
  });

  const isHidden = fieldConfig?.[property.field]?.hidden ?? false;
  if (isHidden) {
    return null;
  }
  return (
    <TextInputField
      key={property.label}
      label={property.label}
      multiline={property.multiline}
      rows={property.rows ?? 1}
      required={fieldConfig?.[property.field]?.required ?? defaultRequired}
      disabled={disabled}
      value={field.value ?? ''}
      error={fieldState.error?.message}
      onChange={(e) => {
        field.onChange(e.target.value);
        onChange?.(e.target.value);
      }}
    />
  );
}

export function FieldAnswers<Values extends Record<string, any> = Record<string, any>>({
  onChange,
  fieldConfig,
  properties,
  defaultRequired = false,
  control,
  name
}: {
  name?: string;
  defaultRequired?: boolean;
  control: Control<ProjectValues, any>;
  fieldConfig?: ProjectFieldConfig<keyof Values & string>;
  onChange?: (values: Partial<Values>) => void;
  properties: ProjectFieldProperty<keyof Values & string>[];
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2} width='100%'>
      {properties.map((property) => (
        <FieldAnswer
          control={control}
          name={name ? `${name}.${property.field}` : property.field}
          defaultRequired={defaultRequired}
          fieldConfig={fieldConfig}
          key={property.field as string}
          onChange={(newValue) => {
            if (onChange) {
              onChange({ [property.field]: newValue } as Partial<Values>);
            }
          }}
          disabled={onChange === undefined}
          property={property}
        />
      ))}
    </Stack>
  );
}
