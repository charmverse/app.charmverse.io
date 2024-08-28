import { InputLabel, FormHelperText, Stack, TextField } from '@mui/material';
import type { EditorProps } from '@packages/charmeditor/ui';
import { Editor } from '@packages/charmeditor/ui';

type Props = {
  disabled?: boolean;
  // rows: number;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
} & EditorProps;

export function CharmTextField({ error, helperText, ...props }: Props) {
  return (
    <Stack>
      <Editor {...props} sx={{ minHeight: '5em' }} error={error} />
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </Stack>
  );
}
