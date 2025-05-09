import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import { useEffect } from 'react';
import type { FieldError } from 'react-hook-form';
import * as yup from 'yup';

import { FieldWrapper } from 'components/common/form/fields/FieldWrapper';

export const schema = yup.object({
  description: yup.string().ensure().trim()
});

export type FormValues = yup.InferType<typeof schema>;

type UserDescriptionProps = {
  description: string | null | undefined;
  onChange: (description: string) => void;
  readOnly?: boolean;
  required?: boolean;
  error?: FieldError;
};

function UserDescription(props: UserDescriptionProps) {
  const { description = '', error, onChange, readOnly, required } = props;

  return (
    <FieldWrapper label='About me' required={required} error={!!error?.message}>
      <TextField
        value={description}
        disabled={readOnly}
        data-testid='edit-description'
        fullWidth
        error={!!error?.message}
        helperText={error?.message}
        placeholder='Tell the world a bit more about yourself ...'
        multiline
        inputProps={{ maxLength: 500 }}
        minRows={2}
        onChange={async (event) => onChange(event.target.value)}
      />
      <Box justifyContent='end' display='flex'>
        {description?.length ?? 0}/500
      </Box>
    </FieldWrapper>
  );
}

export default UserDescription;
