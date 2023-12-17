import TextField from '@mui/material/TextField';
import { DateTimePicker } from '@mui/x-date-pickers';
import { DateTime } from 'luxon';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

import { InputSearchMemberMultiple } from '../InputSearchMember';

type Props = ControlFieldProps & FieldProps;

export const PersonInputField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      endAdornment,
      description,
      iconLabel,
      inline,
      required,
      onChange,
      value,
      error,
      helperText,
      disabled,
      placeholder
    },
    ref
  ) => {
    return (
      <FieldWrapper
        endAdornment={endAdornment}
        description={description}
        required={required}
        label={label}
        inline={inline}
        iconLabel={iconLabel}
      >
        <InputSearchMemberMultiple
          onChange={(ids) => {
            onChange?.(ids);
          }}
          helperText={helperText}
          error={!!error}
          disabled={disabled}
          placeholder={placeholder}
          defaultValue={value as unknown as string[]}
        />
      </FieldWrapper>
    );
  }
);
