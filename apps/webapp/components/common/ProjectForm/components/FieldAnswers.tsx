import { Stack } from '@mui/material';
import type { Path } from 'react-hook-form';
import { useController, useFormContext } from 'react-hook-form';

import { MultiTextInputField } from 'components/common/form/fields/MultiTextInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import { getFieldConfig } from '@packages/lib/projects/formField';
import type { ProjectFieldProperty, FieldConfig, ProjectFieldConfig } from '@packages/lib/projects/formField';
import type { ProjectAndMembersPayload } from '@packages/lib/projects/interfaces';

function FieldAnswer({
  property,
  fieldConfig,
  name,
  disabled,
  onChange
}: {
  disabled?: boolean;
  name: Path<ProjectAndMembersPayload>;
  property: ProjectFieldProperty;
  fieldConfig?: ProjectFieldConfig;
  onChange?: (payload: Record<string, any>) => void;
}) {
  const { control, register, watch } = useFormContext<ProjectAndMembersPayload>();
  const { field, fieldState } = useController({
    control,
    name
  });

  const registeredField = register(name, {
    setValueAs: (value) =>
      typeof value === 'string' ? value?.trim() : Array.isArray(value) ? value.filter((v) => Boolean(v.trim())) : value
  });

  const isShown = getFieldConfig(fieldConfig).show;
  if (!isShown) {
    return null;
  }

  if (property.field === 'websites' || property.field === 'socialUrls') {
    return (
      <MultiTextInputField
        data-test={`project-field-${name}`}
        control={control}
        watch={watch}
        disabled={disabled}
        label={property.label}
        placeholder='https://charmverse.io'
        {...registeredField}
        name={field.name as any}
        onChange={(e, values) => {
          if (onChange) {
            onChange({ [property.field]: values });
          }
        }}
      />
    );
  }

  return (
    <TextInputField
      key={property.label}
      label={property.label}
      multiline={property.multiline}
      rows={property.rows ?? 1}
      required={fieldConfig?.required}
      disabled={disabled}
      error={fieldState.error?.message}
      data-test={`project-field-${name}`}
      {...field}
      value={(field.value as string) ?? ''}
      onChange={(e) => {
        field.onChange(e);
        if (onChange) {
          onChange({ [property.field]: e.target.value.trim() });
        }
      }}
    />
  );
}

export function FieldAnswers({
  fieldConfig,
  properties,
  namePrefix,
  disabled,
  onChange
}: {
  disabled?: boolean;
  namePrefix?: string;
  fieldConfig: FieldConfig;
  properties: ProjectFieldProperty[];
  onChange?: (onChange: Record<string, any>) => void;
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2} width='100%'>
      {properties.map((property) => (
        <FieldAnswer
          name={(namePrefix ? `${namePrefix}.${property.field}` : property.field) as Path<ProjectAndMembersPayload>}
          fieldConfig={fieldConfig[property.field]}
          key={property.field as string}
          disabled={disabled}
          property={property}
          onChange={onChange}
        />
      ))}
    </Stack>
  );
}
