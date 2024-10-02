import type { TextFieldProps } from '@mui/material';
import { TextField, styled } from '@mui/material';
import { forwardRef } from 'react';

const StyledTextField = styled(TextField, {
  shouldForwardProp: (prop) => prop !== 'disableArrows'
})<{ disableArrows?: boolean }>`
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

export const NumberInputField = forwardRef<HTMLDivElement, TextFieldProps & { disableArrows?: boolean }>(
  (
    {
      label,
      error,
      required,
      placeholder,
      disableArrows = false,
      ...textFieldProps
    }: TextFieldProps & { disableArrows?: boolean },
    ref
  ) => {
    return (
      <StyledTextField
        error={!!error}
        required={required}
        placeholder={placeholder}
        disableArrows={disableArrows}
        ref={ref}
        type='number'
        {...textFieldProps}
      />
    );
  }
);
