import { Stack, Switch, Typography } from '@mui/material';

import { TextInputField } from 'components/common/form/fields/TextInputField';
import type { ProjectFieldProperty } from 'lib/projects/interfaces';

export function FieldsEditor<Values extends Record<string, any> = Record<string, any>>({
  onChange,
  fieldConfig,
  properties,
  defaultRequired,
  isProjectMember
}: {
  onChange?: (fieldConfig: Values) => void;
  fieldConfig: Values;
  properties: ProjectFieldProperty[];
  defaultRequired?: boolean;
  isProjectMember?: boolean;
}) {
  return (
    <Stack display='flex' flexDirection='column' gap={2}>
      {properties.map((property) => {
        // If in edit mode always show the field,
        // otherwise only show the field if it's not hidden
        const isHidden = !onChange && fieldConfig?.[property.field]?.hidden;
        if (isHidden) {
          return null;
        }
        return (
          <Stack
            gap={1}
            key={property.label}
            data-test={`project${isProjectMember ? '-member-' : '-'}${property.field}-field-container`}
          >
            <TextInputField
              label={property.label}
              multiline={property.multiline}
              rows={property.rows ?? 1}
              disabled
              required={fieldConfig?.[property.field]?.required ?? defaultRequired}
            />
            {/** Required fields must always be required and shown */}
            {onChange && !property.strictlyRequired && (
              <Stack gap={1}>
                <Stack gap={0.5} flexDirection='row' alignItems='center'>
                  <Switch
                    size='small'
                    checked={fieldConfig?.[property.field]?.hidden ?? false}
                    onChange={(e) => {
                      const isChecked = e.target.checked;
                      onChange({
                        ...(fieldConfig ?? {}),
                        [property.field]: {
                          required: isChecked ? false : fieldConfig?.[property.field]?.required ?? true,
                          hidden: isChecked
                        }
                      });
                    }}
                    data-test={`project${isProjectMember ? '-member-' : '-'}${property.field}-field-hidden-toggle`}
                  />
                  <Typography>Hidden</Typography>
                </Stack>

                <Stack gap={0.5} flexDirection='row' alignItems='center'>
                  <Switch
                    size='small'
                    disabled={fieldConfig?.[property.field]?.hidden === true}
                    checked={fieldConfig?.[property.field]?.required ?? defaultRequired}
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
