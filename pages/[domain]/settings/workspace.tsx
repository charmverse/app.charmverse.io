import SettingsLayout from 'components/settings/Layout';
import { ReactElement, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import { useForm } from 'react-hook-form';
import Button from 'components/common/Button';
import PrimaryButton from 'components/common/PrimaryButton';
import FieldLabel from 'components/settings/FieldLabel';
import Legend from 'components/settings/Legend';
import Avatar from 'components/settings/LargeAvatar';
import { setTitle } from 'hooks/usePageTitle';
import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { FormValues, schema } from 'components/common/CreateSpaceForm';
import { useSpaces } from 'hooks/useSpaces';
import { useRouter } from 'next/router';
import { yupResolver } from '@hookform/resolvers/yup';
import charmClient from 'charmClient';
import { Box } from '@mui/material';
import { useUser } from 'hooks/useUser';
import NotionIcon from 'public/images/notion_logo.svg';
import SvgIcon from '@mui/material/SvgIcon';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from 'components/common/Snackbar';
import useSnackbar from 'hooks/useSnackbar';
import useSWR from 'swr';

export default function WorkspaceSettings () {

  setTitle('Workspace Options');
  const router = useRouter();
  const [space, setSpace] = useCurrentSpace();
  const [spaces] = useSpaces();
  const [user] = useUser();
  const { message, handleClose, isOpen: isSnackbarOpen, showMessage, severity, setSeverity } = useSnackbar();

  const [isImportingFromNotion, setIsImportingFromNotion] = useState(false);

  const { data, error } = useSWR('import/notion', async () => {
    return charmClient.importFromNotion({ state: router.query.state as string });
  }, {
    isPaused: () => (!router.query.state || isImportingFromNotion),
    shouldRetryOnError: false
  });

  useEffect(() => {
    if (router.query.state) {
      setIsImportingFromNotion(true);
    }
  }, [router.query.state]);

  useEffect(() => {
    if (data && data.error === null) {
      setSeverity('info');
      showMessage('Successfully imported');
      setTimeout(() => {
        setIsImportingFromNotion(false);
        window.location.href = `${window.location.origin}/${router.query.domain}/settings/workspace`;
      }, 1500);
    }
    else if (error) {
      showMessage(error.error);
      setSeverity('error');
      setIsImportingFromNotion(false);
    }
    else if (!router.query.state) {
      setIsImportingFromNotion(false);
    }
  }, [data, error]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty }
  } = useForm<FormValues>({
    defaultValues: space,
    resolver: yupResolver(schema)
  });

  const watchName = watch('name');

  async function onSubmit (values: FormValues) {
    if (!space) return;
    // reload with new subdomain
    const newDomain = space.domain !== values.domain;
    const updatedSpace = await charmClient.updateSpace({ ...space, ...values });
    if (newDomain) {
      window.location.href = router.asPath.replace(space.domain, values.domain);
    }
    else {
      setSpace(updatedSpace);
    }
    reset(updatedSpace);
  }

  async function deleteWorkspace () {
    if (space && window.confirm('Are you sure you want to delete your workspace? This action cannot be undone')) {
      await charmClient.deleteSpace(space!.id);
      const nextSpace = spaces.filter(s => s.id !== space.id)[0];
      window.location.href = nextSpace ? `/${nextSpace.domain}` : '/';
    }
  }

  return (
    <>
      <Legend>Space Details</Legend>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container direction='column' spacing={3}>
          <Grid item>
            <Avatar name={watchName} variant='rounded' />
          </Grid>
          <Grid item>
            <FieldLabel>Name</FieldLabel>
            <TextField
              {...register('name')}
              fullWidth
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>
          <Grid item>
            <FieldLabel>Domain</FieldLabel>
            <TextField
              {...register('domain')}
              fullWidth
              error={!!errors.domain}
              helperText={errors.domain?.message}
            />
          </Grid>
          <Grid item display='flex' justifyContent='space-between'>
            <PrimaryButton disabled={!isDirty} type='submit'>
              Save
            </PrimaryButton>
            <Button variant='outlined' color='error' onClick={deleteWorkspace}>
              Delete Workspace
            </Button>
          </Grid>
        </Grid>
      </form>
      <Legend>Import</Legend>
      <Box sx={{ ml: 1 }}>
        <Button
          sx={{
            color: 'currentcolor'
          }}
          disabled={isImportingFromNotion}
          onClick={async () => {
            const { redirectUrl } = await charmClient.notionLogin({
              spaceId: space!.id,
              redirect: window.location.href,
              account: user?.addresses[0] ?? ''
            });
            window.location.replace(redirectUrl);
          }}
          variant='outlined'
          startIcon={(
            isImportingFromNotion ? <CircularProgress size={20} /> : (
              <SvgIcon>
                <NotionIcon />
              </SvgIcon>
            )
          )}
        >
          {isImportingFromNotion ? 'Importing pages from Notion' : 'Import pages from Notion'}
        </Button>
      </Box>
      <Snackbar severity={severity} handleClose={handleClose} isOpen={isSnackbarOpen} message={message ?? ''} />
    </>
  );
}

WorkspaceSettings.getLayout = (page: ReactElement) => {
  return (
    <SettingsLayout>
      {page}
    </SettingsLayout>
  );
};
