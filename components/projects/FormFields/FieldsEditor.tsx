import { Stack, Switch, Typography } from '@mui/material';

import { TextInputField } from 'components/common/form/fields/TextInputField';

export function FieldsEditor<Values extends Record<string, any> = Record<string, any>>({
  onChange,
  values,
  properties
}: {
  onChange?: (values: Values) => void;
  values: Values;
  properties: {
    field: keyof Values & string;
    required: boolean;
    label: string;
  }[];
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2}>
      {properties.map((property) => (
        <Stack gap={1} key={property.label}>
          <TextInputField
            label={property.label}
            multiline={property.field === 'previousProjects'}
            rows={property.field === 'previousProjects' ? 5 : 1}
            disabled
            required={values?.[property.field]?.required ?? true}
          />
          {onChange && (
            <Stack gap={1}>
              <Stack gap={0.5} flexDirection='row' alignItems='center'>
                <Switch
                  size='small'
                  checked={values?.[property.field]?.hidden ?? true}
                  onChange={(e) => {
                    onChange({
                      ...(values ?? {}),
                      [property.field]: {
                        ...values?.[property.field],
                        hidden: e.target.checked
                      }
                    });
                  }}
                />
                <Typography>Hidden</Typography>
              </Stack>

              <Stack gap={0.5} flexDirection='row' alignItems='center'>
                <Switch
                  size='small'
                  checked={values?.[property.field]?.required ?? true}
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
      ))}
    </Stack>
  );
}
