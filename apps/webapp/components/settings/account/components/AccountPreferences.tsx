import type { User } from '@charmverse/core/prisma';
import { yupResolver } from '@hookform/resolvers/yup';
import LaunchIcon from '@mui/icons-material/Launch';
import {
  useTheme,
  InputLabel,
  MenuItem,
  Select,
  Box,
  TextField,
  Typography,
  Checkbox,
  FormGroup,
  FormControlLabel
} from '@mui/material';
import { formatDateTime, getCurrentDate } from '@packages/lib/utils/dates';
import debounce from '@packages/lib/utils/debounce';
import type { ChangeEvent } from 'react';
import { useCallback } from 'react';
import { useForm } from 'react-hook-form';
import useSWRMutation from 'swr/mutation';
import * as yup from 'yup';

import charmClient from 'charmClient';
import { Button } from 'components/common/Button';
import { useColorMode } from 'hooks/useDarkMode';
import { useUser } from 'hooks/useUser';
import { useUserPreferences } from 'hooks/useUserPreferences';

import Legend from '../../components/Legend';

export const schema = yup.object({
  email: yup.string().ensure().trim().email(),
  emailNotifications: yup.boolean(),
  emailNewsletter: yup.boolean()
});

export type FormValues = yup.InferType<typeof schema>;
export function AccountPreferences() {
  const { userPreferences, updatePreferences } = useUserPreferences();
  const theme = useTheme();
  const { toggleColorMode } = useColorMode();
  const { user, updateUser } = useUser();

  const {
    trigger: saveUser,
    isMutating,
    error
  } = useSWRMutation('/api/profile', (_url, { arg }: Readonly<{ arg: Partial<User> }>) => charmClient.updateUser(arg), {
    onSuccess: (data) => {
      updateUser({
        emailNewsletter: data.emailNewsletter,
        emailNotifications: data.emailNotifications,
        email: data.email
      });
    }
  });

  const {
    register,
    trigger,
    setValue,
    formState: { errors }
  } = useForm<FormValues>({
    defaultValues: {
      email: user?.email || '',
      emailNewsletter: user?.emailNewsletter || false,
      emailNotifications: user?.emailNotifications || false
    },
    mode: 'onChange',
    resolver: yupResolver(schema)
  });

  const onChange = useCallback(async (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setValue(event.target.name as keyof FormValues, value);
    const validation = await trigger();

    if (validation) {
      await saveUser({
        [event.target.name]: value
      });
    }
  }, []);

  const debouncedOnChange = useCallback(debounce(onChange, 300), [onChange]);

  const updateLocale = (locale: string) => {
    updatePreferences({ locale });
  };

  return (
    <>
      <Legend>Account Preferences</Legend>
      <Box
        display='flex'
        gap={2}
        flexDirection='column'
        sx={{ '& .MuiInputBase-root': { width: 'min(350px,100%)' }, '& .MuiFormLabel-root': { mb: 1 } }}
      >
        <Box>
          <InputLabel>
            Your email address
            <br />
            <Typography
              sx={{
                whiteSpace: 'normal'
              }}
              variant='caption'
            >
              This is kept private and only used for notifications and updates
            </Typography>
          </InputLabel>
          <TextField
            {...register('email')}
            fullWidth
            error={!!errors.email}
            helperText={errors.email?.message || error?.message}
            placeholder='me@gmail.com'
            onChange={debouncedOnChange}
          />
          <FormGroup>
            <FormControlLabel
              disabled={!user?.email || isMutating}
              control={
                <Checkbox
                  {...register('emailNotifications')}
                  checked={!!user?.emailNotifications}
                  onChange={onChange}
                />
              }
              label='Receive email updates on mentions, comments, post and other things in CharmVerse.'
            />
            <FormControlLabel
              disabled={!user?.email || isMutating}
              control={
                <Checkbox {...register('emailNewsletter')} checked={!!user?.emailNewsletter} onChange={onChange} />
              }
              label='Receive tips and examples how to use CharmVerse.'
            />
          </FormGroup>
          <Button
            variant='outlined'
            color='inherit'
            sx={{ mt: 1 }}
            href='https://scoutgame.substack.com'
            external
            target='_blank'
            endIcon={<LaunchIcon />}
          >
            Subscribe to newsletter
          </Button>
        </Box>
        <Box>
          <InputLabel>Theme mode</InputLabel>
          <Select value={theme.palette.mode} onChange={toggleColorMode}>
            <MenuItem value='light'>Light</MenuItem>
            <MenuItem value='dark'>Dark</MenuItem>
          </Select>
        </Box>
        <Box>
          <InputLabel>Preferred date and time format:</InputLabel>
          <Select value={userPreferences.locale || ''} displayEmpty onChange={(e) => updateLocale(e.target.value)}>
            <MenuItem value=''>My native format ({formatDateTime(getCurrentDate())})</MenuItem>
            <MenuItem value='en-US'>American English format ({formatDateTime(getCurrentDate(), 'en-US')})</MenuItem>
            <MenuItem value='en-GB'>European English format ({formatDateTime(getCurrentDate(), 'en-GB')})</MenuItem>
          </Select>
        </Box>
      </Box>
    </>
  );
}
