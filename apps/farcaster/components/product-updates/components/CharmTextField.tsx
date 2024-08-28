import { FormHelperText, Stack } from '@mui/material';
import type { EditorProps } from '@packages/charmeditor/ui';
import { Editor } from '@packages/charmeditor/ui';

type Props = {
  // rows: number;
  helperText?: string;
} & EditorProps;

export function CharmTextField({ error, helperText, sx, ...props }: Props) {
  return (
    <Stack>
      <Editor {...props} sx={sx} error={error} />
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </Stack>
  );
}
