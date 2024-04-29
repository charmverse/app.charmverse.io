import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

import { InputSearchMemberMultiple } from '../InputSearchMember';

type Props = ControlFieldProps & FieldProps;

export const PersonInputField = forwardRef<HTMLDivElement, Props>(
  ({ onChange, value, error, helperText, disabled, placeholder, ...inputProps }, ref) => {
    return (
      <FieldWrapper {...inputProps} error={!!error}>
        <InputSearchMemberMultiple
          onChange={(ids) => {
            onChange?.(ids);
          }}
          helperText={helperText}
          error={!!error}
          disabled={disabled}
          placeholder={placeholder}
          ref={ref}
          defaultValue={(value || []) as string[]}
        />
      </FieldWrapper>
    );
  }
);
