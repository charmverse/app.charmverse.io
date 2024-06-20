import { Box, Button, InputLabel, Stack, TextField } from '@mui/material';
import { useForm } from 'react-hook-form';

export function ProjectForm({ onCancel }: { onCancel: VoidFunction }) {
  const form = useForm({
    defaultValues: {},
    reValidateMode: 'onChange',
    criteriaMode: 'all',
    mode: 'onChange'
  });

  return (
    <Stack gap={2}>
      <Stack>
        <InputLabel>Project name</InputLabel>
        <TextField placeholder='Project name' />
      </Stack>
      <Stack justifyContent='space-between' flexDirection='row'>
        <Button color='error' variant='outlined'>
          Cancel
        </Button>
        <Button>Next</Button>
      </Stack>
    </Stack>
  );
}
