import { InputLabel, FormHelperText, Stack } from '@mui/material';
import type { ReactEditorProps } from '@packages/charmeditor';
import { ReactEditor } from '@packages/charmeditor';

type Props = {
  disabled?: boolean;
  // rows: number;
  placeholder?: string;
  helperText?: string;
  error?: boolean;
} & ReactEditorProps;

export function CharmTextField({ error, helperText, ...props }: Props) {
  return (
    <Stack>
      <ReactEditor {...props} />
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </Stack>
  );
}
