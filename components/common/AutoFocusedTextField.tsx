import { TextField, TextFieldProps } from '@mui/material';
import { useEffect, useRef } from 'react';

export function AutoFocusedTextField (props: TextFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return <TextField inputRef={inputRef} fullWidth {...props} />;
}
