import SettingsLayout from 'components/settings/Layout';
import { ReactElement, useEffect, useState } from 'react';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
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
import { Box, Typography } from '@mui/material';
import NotionIcon from 'public/images/notion_logo.svg';
import DiscordIcon from 'public/images/discord_logo.svg';
import SvgIcon from '@mui/material/SvgIcon';
import CircularProgress from '@mui/material/CircularProgress';
import useNotionImport from 'hooks/useNotionImport';
import useDiscordServers from 'hooks/useDiscordServers';
import DiscordServersModal from 'components/common/DiscordServersModal';
import { useSnackbar } from 'hooks/useSnackbar';

export interface FailedImportsError {
  pageId: string,
  type: 'page' | 'database',
  title: string,
  blocks: [string, number][][]
}
export default function WorkspaceSettings () {
  setTitle('Workspace Options');
  const router = useRouter();
  const [space, setSpace] = useCurrentSpace();
  const [spaces] = useSpaces();
  const [isDiscordServersModalOpen, setIsDiscordServersModalOpen] = useState(false);
  const {
    isImportingFromNotion,
    notionFailedImports,
    notionImportError
  } = useNotionImport();

  const {
    discordServers,
    isListingDiscordServers,
    isLoading,
    discordError
  } = useDiscordServers();

  useEffect(() => {
    if (!isLoading && isListingDiscordServers && !discordError) {
      setIsDiscordServersModalOpen(true);
    }
    else {
      setIsDiscordServersModalOpen(false);
    }
  }, [isLoading, discordError, isListingDiscordServers]);

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

  const connectedWithDiscord = space?.discordServerId;
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
      <Box sx={{ ml: 1 }} display='flex' gap={1}>
        <Button
          disabled={isImportingFromNotion}
          href={`/api/notion/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}`}
          variant='outlined'
          startIcon={(
            <SvgIcon sx={{ color: 'text.primary' }}>
              <NotionIcon />
            </SvgIcon>
          )}
          endIcon={(
            isImportingFromNotion && <CircularProgress size={20} />
          )}
        >
          {isImportingFromNotion ? 'Importing pages from Notion' : 'Import pages from Notion'}
        </Button>
        <Box display='flex' gap={1} alignItems='center'>
          <Button
            disabled={isImportingFromNotion}
            href={`/api/discord/login?redirect=${encodeURIComponent(window.location.href.split('?')[0])}&type=server`}
            variant='outlined'
            startIcon={(
              <SvgIcon viewBox='0 -10 70 70' sx={{ color: 'text.primary' }}>
                <DiscordIcon />
              </SvgIcon>
            )}
            endIcon={(
              isLoading && <CircularProgress size={20} />
            )}
          >
            Import Roles
          </Button>
        </Box>
        <DiscordServersModal
          isFetching={isLoading}
          isOpen={isDiscordServersModalOpen}
          discordServers={discordServers}
          onClose={() => {
            setIsDiscordServersModalOpen(false);
          }}
        />
        {notionFailedImports.length !== 0 && (
          <Alert severity='warning' sx={{ mt: 2 }}>
            <Box sx={{
              display: 'flex', gap: 2, flexDirection: 'column'
            }}
            >
              Pages where we encountered issues
              {notionFailedImports.map(failedImport => (
                <div>
                  <Box sx={{
                    display: 'flex',
                    gap: 1
                  }}
                  >
                    <span>Type: {failedImport.type}</span>
                    <span>Title: {failedImport.title}</span>
                    <span>Id: {failedImport.pageId}</span>
                  </Box>
                  {failedImport.blocks.length !== 0 ? (
                    <div>
                      Blocks that failed to import for the page
                      {failedImport.blocks.map((blockTrails, blockTrailsIndex) => (
                        <div>
                          {blockTrailsIndex + 1}. {blockTrails.map(([blockType, blockIndex]) => `${blockType}(${blockIndex + 1})`).join(' -> ')}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </Box>
          </Alert>
        )}
      </Box>
      {notionImportError && (
        <Alert severity='error' sx={{ mt: 2 }}>
          {notionImportError}
        </Alert>
      )}
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
