import { Stack, Switch, Typography } from '@mui/material';

import { TextInputField } from 'components/common/form/fields/TextInputField';

import type { ProjectFieldProperty } from '../interfaces';

export function FieldsEditor<Values extends Record<string, any> = Record<string, any>>({
  onChange,
  values,
  properties,
  defaultRequired
}: {
  onChange?: (values: Values) => void;
  values: Values;
  properties: ProjectFieldProperty[];
  defaultRequired?: boolean;
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2}>
      {properties.map((property) => {
        // If in edit mode always show the field,
        // otherwise only show the field if it's not hidden
        const isHidden = !onChange && values?.[property.field]?.hidden;
        if (isHidden) {
          return null;
        }
        return (
          <Stack gap={1} key={property.label}>
            <TextInputField
              label={property.label}
              multiline={property.multiline}
              rows={property.rows ?? 1}
              disabled
              required={values?.[property.field]?.required ?? defaultRequired}
            />
            {onChange && (
              <Stack gap={1}>
                <Stack gap={0.5} flexDirection='row' alignItems='center'>
                  <Switch
                    size='small'
                    checked={values?.[property.field]?.hidden ?? false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      onChange({
                        ...(values ?? {}),
                        [property.field]: {
                          required: isChecked ? false : values?.[property.field]?.required ?? true,
                          hidden: isChecked
                        }
                      });
                    }}
                  />
                  <Typography>Hidden</Typography>
                </Stack>

                <Stack gap={0.5} flexDirection='row' alignItems='center'>
                  <Switch
                    size='small'
                    disabled={values?.[property.field]?.hidden === true}
                    checked={values?.[property.field]?.required ?? defaultRequired}
                    onChange={(e) => {
                      onChange({
                        ...(values ?? {}),
                        [property.field]: {
                          ...values?.[property.field],
                          required: e.target.checked
                        }
                      });
                    }}
                  />
                  <Typography>Required</Typography>
                </Stack>
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
