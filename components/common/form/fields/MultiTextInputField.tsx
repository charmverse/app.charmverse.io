import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { IconButton, Stack, TextField } from '@mui/material';
import type { FieldValues, Control, FieldArrayPath, Path } from 'react-hook-form';
import { Controller, useFieldArray, useController } from 'react-hook-form';

import { Button } from 'components/common/Button';

import { FieldWrapper } from './FieldWrapper';

export function MultiTextInputField<T extends FieldValues>({
  control,
  disabled,
  label,
  name,
  onChange,
  placeholder,
  'data-test': dataTest
}: {
  control: Control<T>;
  disabled?: boolean;
  label: string;
  name: keyof T;
  onChange?: (values: string[]) => void;
  placeholder: string;
  'data-test'?: string;
}) {
  const typedName = name as FieldArrayPath<T>;
  const { fields, append, remove } = useFieldArray({
    control,
    name: typedName
  });
  const { field: formField } = useController({
    name: name as Path<T>,
    control
  });

  const onChangeValue = (index: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValues = [...formField.value];
    newValues[index] = e.target.value;
    onChange?.(newValues);
  };

  return (
    <Stack>
      <FieldWrapper label={label}>
        <Stack direction='row' gap={1} alignItems='center' mb={1}>
          <Controller
            control={control}
            name={`${typedName}.0` as Path<T>}
            render={({ field: _field, fieldState }) => (
              <TextField
                disabled={disabled}
                data-test={dataTest}
                fullWidth
                placeholder={placeholder}
                error={!!fieldState.error}
                {..._field}
                onChange={onChangeValue(0)}
              />
            )}
          />
        </Stack>
        {fields.slice(1).map((field, index) => (
          <Stack key={field.id} gap={1} mb={1} direction='row'>
            <Controller
              control={control}
              name={`${typedName}.${index + 1}` as Path<T>}
              render={({ field: _field, fieldState }) => (
                <Stack width='100%' gap={1} alignItems='center' flexDirection='row'>
                  <TextField
                    disabled={disabled}
                    fullWidth
                    placeholder={placeholder}
                    error={!!fieldState.error}
                    onChange={onChangeValue(index)}
                    {..._field}
                  />
                  <IconButton disabled={disabled} size='small' onClick={() => remove(index + 1)}>
                    <DeleteIcon fontSize='small' color='error' />
                  </IconButton>
                </Stack>
              )}
            />
          </Stack>
        ))}
      </FieldWrapper>
      <Button
        sx={{
          width: 'fit-content'
        }}
        startIcon={<AddIcon fontSize='small' />}
        size='small'
        disabled={disabled}
        variant='outlined'
        color='secondary'
        onClick={() => {
          append('' as any);
        }}
      >
        Add
      </Button>
    </Stack>
  );
}
