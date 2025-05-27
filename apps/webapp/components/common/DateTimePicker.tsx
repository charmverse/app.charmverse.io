import { styled } from '@mui/material';
import { TextField } from '@mui/material';
import type { TextFieldProps } from '@mui/material';
import type { DateTimePickerProps } from '@mui/x-date-pickers/DateTimePicker';
import { DateTimePicker as MuiDateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import type { DateTime } from 'luxon';
import { forwardRef, useState } from 'react';

const StyledTextField = styled(TextField)`
  cursor: pointer;
  .MuiInputBase-root {
    background: transparent;
  }
  .octo-propertyvalue {
    box-sizing: border-box; // copied from focalboard
  }
  fieldset {
    border: 0 none;
  }
`;

export const FocalBoardTextFieldSlot = forwardRef<HTMLDivElement, TextFieldProps>((props, ref) => {
  if (props.inputProps) {
    props.inputProps.className = 'octo-propertyvalue';
  }
  // don't show the default placeholder from Datepicker
  const actualValue = (props.value as string)?.startsWith('MM/DD/YYYY') ? '' : props.value;
  return <StyledTextField {...props} ref={ref} value={actualValue} />;
});

export const TextFieldSlot = forwardRef<HTMLDivElement, TextFieldProps>((props: TextFieldProps) => {
  // dont show the default placeholder from Datepicker
  const actualValue = (props.value as string)?.startsWith('MM/DD/YYYY') ? '' : props.value;
  return <TextField {...props} value={actualValue} />;
});

// customized date picker that opens when clicking the inpu
export function DateTimePicker<T extends DateTime>({
  variant,
  placeholder,
  ...props
}: DateTimePickerProps<T> & { variant?: 'card_property'; placeholder?: string | boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <MuiDateTimePicker
        open={open}
        sx={props.sx}
        // default media query just checks for cursor input
        desktopModeMediaQuery='(min-width: 600px)'
        // disableOpenPicker - this optoin messes up the picker for some reason
        onClose={() => setOpen(false)}
        {...props}
        slots={{
          ...props.slots,
          // hide the calendar picker icon
          openPickerButton: HiddenElement,
          textField: variant === 'card_property' ? FocalBoardTextFieldSlot : TextFieldSlot
        }}
        slotProps={{
          ...props.slotProps,
          field: { ...props.slotProps?.field, clearable: true },
          textField: {
            ...props.slotProps?.textField,
            placeholder:
              typeof placeholder === 'string' ? (placeholder ?? 'Empty') : placeholder === true ? 'Empty' : '',
            onClick: () => setOpen(true)
          }
        }}
      />
    </div>
  );
}

export function HiddenElement() {
  return <div />;
}
