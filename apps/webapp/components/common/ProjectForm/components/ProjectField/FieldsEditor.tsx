import { FormControlLabel, Stack, Switch, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';

import { MultiTextInputField } from 'components/common/form/fields/MultiTextInputField';
import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { FieldConfig, ProjectFieldProperty } from '@packages/lib/projects/formField';

export function FieldsEditor({
  onChange,
  fieldConfig,
  properties,
  isProjectMember
}: {
  onChange?: (fieldConfig: FieldConfig) => void;
  fieldConfig: FieldConfig;
  properties: ProjectFieldProperty[];
  isProjectMember?: boolean;
}) {
  const { control, watch } = useForm();
  return (
    <Stack display='flex' flexDirection='column' gap={2}>
      {properties.map((property) => {
        // If in edit mode always show the field,
        // otherwise only show the field if it's not hidden
        const isShown = onChange ? true : (fieldConfig?.[property.field]?.show ?? true);
        if (!isShown) {
          return null;
        }
        return (
          <Stack
            gap={1}
            key={property.label}
            data-test={`project${isProjectMember ? '-member-' : '-'}${property.field}-field-container`}
          >
            {property.multiple ? (
              <MultiTextInputField
                placeholder=''
                control={control}
                disabled
                watch={watch}
                label={property.label}
                name='example-input'
              />
            ) : (
              <TextInputField
                label={property.label}
                multiline={property.multiline}
                rows={property.rows ?? 1}
                disabled
                required={fieldConfig?.[property.field]?.required}
              />
            )}
            {/** Required fields must always be required and shown */}
            {onChange && !property.alwaysRequired && (
              <Stack gap={1} flexDirection='row' px={1} alignItems='center'>
                <FormControlLabel
                  control={
                    <Switch
                      size='small'
                      checked={fieldConfig?.[property.field]?.show ?? true}
                      onChange={(e) => {
                        const isChecked = e.target.checked;
                        onChange({
                          ...(fieldConfig ?? {}),
                          [property.field]: {
                            required: !isChecked ? false : (fieldConfig?.[property.field]?.required ?? true),
                            show: isChecked,
                            private: !isChecked ? false : (fieldConfig?.[property.field]?.private ?? true)
                          }
                        });
                      }}
                      data-test={`project${isProjectMember ? '-member-' : '-'}${property.field}-field-show-toggle`}
                      sx={{ mr: 0.5 }}
                    />
                  }
                  label={<Typography>Show</Typography>}
                />

                <FormControlLabel
                  control={
                    <Switch
                      size='small'
                      disabled={fieldConfig?.[property.field]?.show === false}
                      checked={fieldConfig?.[property.field]?.required}
                      onChange={(e) => {
                        onChange({
                          ...(fieldConfig ?? {}),
                          [property.field]: {
                            ...fieldConfig?.[property.field],
                            required: e.target.checked
                          }
                        });
                      }}
                      data-test={`project${isProjectMember ? '-member-' : '-'}${property.field}-field-required-toggle`}
                      sx={{ mr: 0.5 }}
                    />
                  }
                  label={<Typography>Required</Typography>}
                />
                {property.allowPrivate && (
                  <FormControlLabel
                    control={
                      <Switch
                        size='small'
                        disabled={fieldConfig?.[property.field]?.show === false}
                        checked={fieldConfig?.[property.field]?.private ?? true}
                        onChange={(e) => {
                          onChange({
                            ...(fieldConfig ?? {}),
                            [property.field]: {
                              ...fieldConfig?.[property.field],
                              private: e.target.checked
                            }
                          });
                        }}
                        data-test={`project${isProjectMember ? '-member-' : '-'}${property.field}-field-private-toggle`}
                        sx={{ mr: 0.5 }}
                      />
                    }
                    label={<Typography>Private</Typography>}
                  />
                )}
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
}
