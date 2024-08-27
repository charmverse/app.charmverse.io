import { InputLabel, FormHelperText, Stack } from '@mui/material';
import { ReactEditor, ReactEditorProps } from '@packages/charmeditor';

type Props = {
  disabled?: boolean;
  // rows: number;
  placeholder: string;
  helperText?: string;
  error?: boolean;
  value?: object | null;
  onChange: (value: { json: object; text: string }) => void;
};

export function CharmTextField({ error, helperText, value, ...props }: Props) {
  return (
    <Stack>
      <ReactEditor value={value} />
      {helperText && <FormHelperText error={error}>{helperText}</FormHelperText>}
    </Stack>
  );
}
