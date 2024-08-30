import { FormHelperText, Stack } from '@mui/material';
import type { EditorProps } from '@packages/charmeditor/ui';
import { Editor } from '@packages/charmeditor/ui';
import { forwardRef } from 'react';

type Props = {
  // rows: number;
  helperText?: string;
} & EditorProps;

export const CharmTextField = forwardRef<HTMLDivElement | null, Props>(function CharmTextField(
  { error, helperText, sx, ...props },
  ref
) {
  return (
    <Stack ref={ref}>
      <Editor {...props} sx={sx} error={error} />
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </Stack>
  );
});
