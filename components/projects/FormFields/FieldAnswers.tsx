import { Stack } from '@mui/material';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProjectFieldConfig } from '../interfaces';

export function FieldAnswers<Values extends Record<string, any> = Record<string, any>>({
  onChange,
  values,
  fieldConfig,
  properties
}: {
  fieldConfig?: ProjectFieldConfig<keyof Values & string>;
  onChange?: (values: Values) => void;
  values: Values;
  properties: {
    field: keyof Values & string;
    required: boolean;
    label: string;
  }[];
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2} width='100%'>
      {properties.map((property) => (
        <TextInputField
          key={property.field}
          label={property.label}
          multiline={property.field === 'previousProjects'}
          rows={property.field === 'previousProjects' ? 5 : 1}
          required={fieldConfig?.[property.field]?.required ?? false}
          disabled={onChange === undefined}
          value={values?.[property.field]}
          onChange={(e) => {
            onChange?.({
              ...values,
              [property.field]: e.target.value
            });
          }}
        />
      ))}
    </Stack>
  );
}
