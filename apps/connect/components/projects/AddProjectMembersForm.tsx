import { Box, Button, Card, CardContent, Stack, Typography } from '@mui/material';
import { useAction } from 'next-safe-action/hooks';
import type { Control, UseFormHandleSubmit } from 'react-hook-form';

import { Avatar } from 'components/common/Avatar';
import { actionCreateProject } from 'lib/projects/createProjectAction';

import type { FormValues } from './utils/form';

export function AddProjectMembersForm({
  control,
  isValid,
  handleSubmit,
  onBack
}: {
  onBack: VoidFunction;
  control: Control<FormValues>;
  isValid: boolean;
  handleSubmit: UseFormHandleSubmit<FormValues>;
}) {
  const { executeAsync, isExecuting } = useAction(actionCreateProject);

  return (
    <Stack gap={1}>
      <Card>
        <CardContent sx={{ display: 'flex', gap: 2 }}>
          <Avatar
            size='xLarge'
            name='ccarella.eth'
            avatar='https://cdn.charmverse.io/user-content/d5b4e5db-868d-47b0-bc78-ebe9b5b2c835/0925e1d3-5d71-4bea-a9d2-274e9cfab80d/Noun-839.jpg'
          />
          <Box>
            <Typography>Ccarella</Typography>
            <Typography>Memetic-Artist. Techno-Optimist.</Typography>
            <Typography>Purple. Energy. Nouns. Optimism</Typography>
            <Typography>@CharmVerse</Typography>
          </Box>
        </CardContent>
      </Card>
      <Stack direction='row' justifyContent='space-between'>
        <Button variant='outlined' color='secondary' onClick={onBack}>
          Back
        </Button>
        <Button
          type='submit'
          disabled={!isValid || isExecuting}
          onClick={() => handleSubmit((data) => executeAsync(data))}
        >
          Publish
        </Button>
      </Stack>
    </Stack>
  );
}
