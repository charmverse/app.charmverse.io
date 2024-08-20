import AddIcon from '@mui/icons-material/AddOutlined';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { IconButton, Stack, Tooltip } from '@mui/material';
import type { FieldValues, Control, FieldArrayPath, Path, UseFormWatch } from 'react-hook-form';
import { Controller, useFieldArray } from 'react-hook-form';

import { Button } from 'components/common/Button';

import { FieldWrapper } from './FieldWrapper';
import { CustomTextField } from './TextInputField';

export function MultiTextInputField<T extends FieldValues>({
  control,
  watch,
  disabled,
  label,
  name,
  onChange,
  placeholder,
  'data-test': dataTest
}: {
  control: Control<T>;
  watch: UseFormWatch<T>;
  disabled?: boolean;
  label: string;
  name: keyof T;
  // event is null when an element is removed
  onChange?: (e: React.ChangeEvent<HTMLInputElement> | null, values: string[]) => void;
  placeholder: string;
  'data-test'?: string;
}) {
  const typedName = name as FieldArrayPath<T>;
  const { fields, append, remove } = useFieldArray({
    control,
    name: typedName
  });
  const watchedValue = watch(name as Path<T>);
  const onChangeValue =
    (originalOnChange: (e: React.ChangeEvent<HTMLInputElement>) => void, index: number) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValues = [...watchedValue];
      newValues[index] = e.target.value;
      // update the individual text field
      originalOnChange(e);
      // call onChange handler for backend update
      onChange?.(e, newValues);
    };

  const removeValue = (index: number) => {
    const newValues = [...watchedValue];
    newValues.splice(index, 1);
    remove(index);
    // update the backend
    onChange?.(null, newValues);
  };

  return (
    <Stack>
      <FieldWrapper label={label}>
        <Stack direction='row' gap={1} alignItems='center' mb={1}>
          <Controller
            control={control}
            name={`${typedName}.0` as Path<T>}
            render={({ field: _field, fieldState }) => (
              <CustomTextField
                disabled={disabled}
                data-test={dataTest}
                fullWidth
                placeholder={placeholder}
                error={!!fieldState.error}
                {..._field}
                onChange={onChangeValue(_field.onChange, 0)}
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
                  <CustomTextField
                    disabled={disabled}
                    fullWidth
                    placeholder={placeholder}
                    error={!!fieldState.error}
                    {..._field}
                    onChange={onChangeValue(_field.onChange, index + 1)}
                  />
                  {!disabled && (
                    <Tooltip title='Remove'>
                      <IconButton size='small' onClick={() => removeValue(index + 1)}>
                        <DeleteIcon fontSize='small' color='secondary' />
                      </IconButton>
                    </Tooltip>
                  )}
                </Stack>
              )}
            />
          </Stack>
        ))}
      </FieldWrapper>
      {!disabled && (
        <Button
          sx={{
            width: 'fit-content'
          }}
          startIcon={<AddIcon fontSize='small' />}
          size='small'
          variant='outlined'
          color='secondary'
          onClick={() => {
            append('' as any);
          }}
        >
          Add
        </Button>
      )}
    </Stack>
  );
}
