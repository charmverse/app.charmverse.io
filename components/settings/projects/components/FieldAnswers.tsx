import { Stack } from '@mui/material';
import type { Path } from 'react-hook-form';
import { useController, useFormContext } from 'react-hook-form';

import { TextInputField } from 'components/common/form/fields/TextInputField';
import { getFieldConfig } from 'lib/projects/formField';
import type { ProjectFieldProperty, FieldConfig } from 'lib/projects/formField';
import type { ProjectAndMembersPayload } from 'lib/projects/interfaces';

function FieldAnswer({
  property,
  fieldConfig,
  defaultRequired,
  name,
  disabled,
  onChange
}: {
  disabled?: boolean;
  name: Path<ProjectAndMembersPayload>;
  defaultRequired?: boolean;
  property: ProjectFieldProperty;
  fieldConfig?: FieldConfig;
  onChange?: (payload: Record<string, any>) => void;
}) {
  const { control, register } = useFormContext<ProjectAndMembersPayload>();

  const { field, fieldState } = useController({
    control,
    name
  });

  const registeredField = register(name, {
    setValueAs: (value) => value?.trim()
  });

  const isShown = getFieldConfig(fieldConfig?.[property.field]).show;
  if (!isShown) {
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
      value={(field.value as string) ?? ''}
      error={fieldState.error?.message}
      data-test={`project-field-${name}`}
      {...registeredField}
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
  defaultRequired = false,
  name,
  disabled,
  onChange
}: {
  disabled?: boolean;
  name?: string;
  defaultRequired?: boolean;
  fieldConfig?: FieldConfig;
  properties: ProjectFieldProperty[];
  onChange?: (onChange: Record<string, any>) => void;
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2} width='100%'>
      {properties.map((property) => (
        <FieldAnswer
          name={(name ? `${name}.${property.field}` : property.field) as Path<ProjectAndMembersPayload>}
          defaultRequired={defaultRequired}
          fieldConfig={fieldConfig}
          key={property.field as string}
          disabled={disabled}
          property={property}
          onChange={onChange}
        />
      ))}
    </Stack>
  );
}
