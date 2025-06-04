import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import type { DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { useState } from 'react';

import { HiddenElement, TextFieldSlot } from './DateTimePicker';

// customized date picker that opens when clicking the inpu
export function DatePicker(props: DatePickerProps) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <MuiDatePicker
        open={open}
        // default media query just checks for cursor input
        desktopModeMediaQuery='(min-width: 600px)'
        // disableOpenPicker - this optoin messes up the picker for some reason
        onClose={() => setOpen(false)}
        {...props}
        slots={{
          ...props.slots,
          // hide the calendar picker icon
          openPickerButton: HiddenElement,
          textField: TextFieldSlot
        }}
        slotProps={{
          field: { ...props.slotProps?.field, clearable: true },
          textField: { ...props.slotProps?.textField, onClick: () => setOpen(true) }
        }}
      />
    </div>
  );
}
