import styled from '@emotion/styled';
import type { SxProps, Theme, TextFieldProps } from '@mui/material';
import { TextField } from '@mui/material';
import { forwardRef } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

type Props = ControlFieldProps &
  FieldProps & { disableArrows?: boolean } & Pick<TextFieldProps, 'fullWidth' | 'inputProps' | 'sx'>;

const StyledTextField = styled(TextField)<{ disableArrows: boolean }>`
  ${({ disableArrows }) =>
    disableArrows
      ? `
      /* Chrome, Safari, Edge, Opera */
      input::-webkit-outer-spin-button,
      input::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      /* Firefox */
      input[type=number] {
        -moz-appearance: textfield;
      }`
      : ''}
`;

export const NumberInputField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      labelEndAdornment,
      iconLabel,
      description,
      inline,
      error,
      required,
      placeholder,
      disableArrows = false,
      inputEndAdornment,
      ...textFieldProps
    }: Props,
    ref
  ) => {
    return (
      <FieldWrapper
        inputEndAdornment={inputEndAdornment}
        labelEndAdornment={labelEndAdornment}
        description={description}
        required={required}
        label={label}
        inline={inline}
        iconLabel={iconLabel}
      >
        <StyledTextField
          error={!!error}
          required={required}
          placeholder={placeholder}
          disableArrows={disableArrows}
          ref={ref}
          type='number'
          {...textFieldProps}
        />
      </FieldWrapper>
    );
  }
);
