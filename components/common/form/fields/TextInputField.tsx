import styled from '@emotion/styled';
import { Box, Link, TextField } from '@mui/material';
import type { TextFieldProps, InputProps, InputBaseComponentProps } from '@mui/material';
import { forwardRef, useMemo } from 'react';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';
import type { ControlFieldProps, FieldProps } from 'components/common/form/interfaces';

// In readonly mode, use a div instead of input/textarea so that we can use anchor tags
const ReadOnlyText = styled.div`
  cursor: text;
`;

// Convert a string into a React component, and wrap links with anchor tags
function LinkifiedValue({ value }: { value: string }): JSX.Element {
  return (
    <ReadOnlyText>
      {value.split(/(https?:\/\/[^\s]+)/g).map((part, index) =>
        part.startsWith('http') ? (
          <Link
            underline='always' // matches inline charm editor
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            href={part}
            target='_blank'
            rel='noopener noreferrer'
          >
            {part}
          </Link>
        ) : (
          part
        )
      )}
    </ReadOnlyText>
  );
}

type Props = ControlFieldProps &
  FieldProps & { multiline?: boolean; inputEndAdornmentAlignItems?: string; rows?: number; maxRows?: number };

export const CustomTextField = forwardRef<HTMLDivElement, TextFieldProps & { error?: boolean }>(
  ({ error, ...props }, ref) => {
    const InputProps = useMemo<Partial<InputProps> | undefined>(() => {
      if (props.disabled) {
        return {
          // eslint-disable-next-line react/no-unstable-nested-components
          inputComponent: (_props: InputBaseComponentProps) => <LinkifiedValue value={props.value as string} />
        };
      }
      return undefined;
    }, [props.disabled, props.value]);

    return (
      <TextField
        // InputProps={{ inputComponent: Box }}
        ref={ref}
        fullWidth
        placeholder={props.placeholder}
        InputProps={InputProps}
        error={error}
        {...props}
      />
    );
  }
);

export const TextInputField = forwardRef<HTMLDivElement, Props>(
  (
    {
      label,
      labelEndAdornment,
      inputEndAdornment,
      inputEndAdornmentAlignItems,
      iconLabel,
      inline,
      error,
      description,
      multiline = false,
      required,
      topComponent,
      ...inputProps
    },
    ref
  ) => {
    return (
      <FieldWrapper
        inputEndAdornmentAlignItems={inputEndAdornmentAlignItems || multiline ? 'flex-start' : 'center'}
        labelEndAdornment={labelEndAdornment}
        inputEndAdornment={inputEndAdornment}
        description={description}
        required={required}
        label={label}
        inline={inline}
        iconLabel={iconLabel}
        error={!!error}
      >
        {/** Without label the field wrapper wraps its children inside a Fragment and if the container already has spacing it creates an uneven spacing with the extra margin bottom */}
        {topComponent && <Box mb={label ? 1 : 0}>{topComponent}</Box>}
        <CustomTextField
          // InputProps={{ className: 'Mui-error' }}
          error={!!error}
          fullWidth
          required={required}
          multiline={multiline}
          {...inputProps}
          ref={ref}
        />
      </FieldWrapper>
    );
  }
);
