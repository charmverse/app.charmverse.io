import { Stack } from '@mui/material';
import type { Path } from 'react-hook-form';
import { useController, useFormContext } from 'react-hook-form';

import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { ProjectValues, ProjectFieldProperty, FieldConfig } from 'lib/projects/interfaces';

function FieldAnswer({
  property,
  fieldConfig,
  defaultRequired,
  name,
  disabled
}: {
  disabled?: boolean;
  name: Path<ProjectValues>;
  defaultRequired?: boolean;
  property: ProjectFieldProperty;
  fieldConfig?: FieldConfig;
}) {
  const { control, register } = useFormContext<ProjectValues>();

  const { field, fieldState } = useController({
    control,
    name
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
      value={(field.value as string) ?? ''}
      error={fieldState.error?.message}
      data-test={`project-field-${name}`}
      {...register(name)}
    />
  );
}

export function FieldAnswers({
  fieldConfig,
  properties,
  defaultRequired = false,
  name,
  disabled
}: {
  disabled?: boolean;
  name?: string;
  defaultRequired?: boolean;
  fieldConfig?: FieldConfig;
  properties: ProjectFieldProperty[];
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2} width='100%'>
      {properties.map((property) => (
        <FieldAnswer
          name={(name ? `${name}.${property.field}` : property.field) as Path<ProjectValues>}
          defaultRequired={defaultRequired}
          fieldConfig={fieldConfig}
          key={property.field as string}
          disabled={disabled}
          property={property}
        />
      ))}
    </Stack>
  );
}
