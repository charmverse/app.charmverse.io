import { Stack } from '@mui/material';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProjectFieldConfig, ProjectFieldProperty } from '../interfaces';

export function FieldAnswers<Values extends Record<string, any> = Record<string, any>>({
  onChange,
  values,
  fieldConfig,
  properties
}: {
  fieldConfig?: ProjectFieldConfig<keyof Values & string>;
  onChange?: (values: Values) => void;
  values: Values;
  properties: ProjectFieldProperty<keyof Values>[];
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2} width='100%'>
      {properties.map((property) => {
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
            required={fieldConfig?.[property.field]?.required ?? true}
            disabled={onChange === undefined}
            value={values?.[property.field]}
            onChange={(e) => {
              onChange?.({
                ...values,
                [property.field]: e.target.value
              });
            }}
          />
        );
      })}
    </Stack>
  );
}
