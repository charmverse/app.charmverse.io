import type { FormControlLabelProps } from '@mui/material';
import { FormControlLabel as MuiFormControlLabel } from '@mui/material';

// display the label on the left of the checkbox/toggle, and full-width of its container
export function FormControlLabel(props: FormControlLabelProps) {
  return (
    <MuiFormControlLabel
      componentsProps={{
        typography: { variant: 'body2' }
      }}
      labelPlacement='start'
      sx={{ width: '100%', justifyContent: 'space-between', m: 0 }}
      {...props}
    />
  );
}
