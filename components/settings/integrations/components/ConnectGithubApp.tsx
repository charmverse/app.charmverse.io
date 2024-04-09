import { log } from '@charmverse/core/log';
import { yupResolver } from '@hookform/resolvers/yup';
import type { SelectChangeEvent } from '@mui/material';
import { Grid, MenuItem, Select, Stack, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';

import {
  useConnectGithubRepository,
  useDisconnectGithubApplication,
  useGetGithubApplicationData
} from 'charmClient/hooks/spaces';
import { Button } from 'components/common/Button';
import { useRewardTemplates } from 'components/rewards/hooks/useRewardTemplates';
import { useGithubApp } from 'hooks/useGithubApp';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { useSnackbar } from 'hooks/useSnackbar';
import type { GithubApplicationData } from 'pages/api/spaces/[id]/github';
import type { ConnectGithubRepoPayload } from 'pages/api/spaces/[id]/github/repo';

export const schema = yup.object({
  repositoryId: yup.string().required(),
  rewardTemplateId: yup.string().uuid().required(),
  repositoryName: yup.string().required()
});

function ConnectedGithubAppSection({
  installationId,
  spaceId,
  repositories,
  rewardRepo,
  githubAppName
}: {
  spaceId: string;
  installationId: number;
  rewardRepo: Partial<{
    repositoryId: string;
    rewardTemplateId: string;
    repositoryName: string;
  }>;
  repositories: GithubApplicationData['repositories'];
  githubAppName: string;
}) {
  const { trigger: disconnectGithubApplication, isMutating: isDisconnectingGithubApplication } =
    useDisconnectGithubApplication(spaceId);
  const { mutate } = useGetGithubApplicationData(spaceId);
  const { showMessage } = useSnackbar();
  const { trigger: connectGithubRepository, isMutating: isConnectingGithubRepository } =
    useConnectGithubRepository(spaceId);
  const { templates, isLoading: isLoadingRewardTemplates } = useRewardTemplates();

  async function handleDisconnect() {
    try {
      await disconnectGithubApplication();
      showMessage('Github application disconnected', 'success');
      mutate(() => undefined, {
        revalidate: false
      });
    } catch (err) {
      showMessage('Failed to disconnect Github application', 'error');
      log.error('Failed to disconnect Github application', {
        installationId,
        spaceId
      });
    }
  }

  const { setValue, watch, getValues, formState } = useForm({
    defaultValues: rewardRepo,
    reValidateMode: 'onChange',
    resolver: yupResolver(schema)
  });

  const repositoryId = watch('repositoryId');
  const rewardTemplateId = watch('rewardTemplateId');

  async function handleChangeRepo(event: SelectChangeEvent<string>) {
    const repoId = event.target.value;
    const repository = repositories.find((repo) => repo.id.toString() === repoId);
    if (!repository) {
      return;
    }

    setValue('repositoryId', repoId, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
    setValue('repositoryName', repository.name, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true
    });
  }

  const disabled = isConnectingGithubRepository || isDisconnectingGithubApplication || isLoadingRewardTemplates;

  async function handleConnectGithubRepository() {
    if (!formState.isValid) {
      return;
    }

    const connectGithubPayload = getValues();

    try {
      await connectGithubRepository(connectGithubPayload as ConnectGithubRepoPayload);
      showMessage('Github repository connected', 'success');
    } catch (err) {
      showMessage('Failed to connect Github repository', 'error');
      log.error('Failed to connect Github repository', {
        installationId,
        spaceId,
        rewardTemplateId: connectGithubPayload.rewardTemplateId,
        repositoryId: connectGithubPayload.repositoryId
      });
    }
  }

  return (
    <Grid container direction='row' gap={1} justifyContent='space-between' alignItems='center'>
      <Grid item xs={12}>
        <Stack gap={2}>
          <Typography>
            Connected to <strong>{githubAppName}</strong>
          </Typography>
          <Stack flexDirection='row' gap={1}>
            <Select
              sx={{
                width: '50%'
              }}
              disabled={disabled}
              displayEmpty
              renderValue={(repoId) => {
                const repo = repositories.find((repository) => repository.id.toString() === repoId);
                if (repo) {
                  return <Typography>{repo.name}</Typography>;
                }

                return <Typography color='secondary'>Select a github repo</Typography>;
              }}
              onChange={handleChangeRepo}
              placeholder='Select a repository'
              value={repositoryId ?? ''}
            >
              {repositories.map((repository) => (
                <MenuItem key={repository.id} value={repository.id.toString()}>
                  <Typography>{repository.name}</Typography>
                </MenuItem>
              ))}
            </Select>
            <Select
              sx={{
                width: '50%'
              }}
              disabled={disabled}
              displayEmpty
              onChange={(e) => {
                setValue('rewardTemplateId', e.target.value);
              }}
              renderValue={(templateId) => {
                const template = templates?.find((tpl) => tpl.page.id === templateId);
                if (template) {
                  return <Typography>{template.page.title}</Typography>;
                }

                return <Typography color='secondary'>Select a reward template</Typography>;
              }}
              placeholder='Select a reward template'
              value={rewardTemplateId ?? ''}
            >
              {templates?.map((template) => (
                <MenuItem key={template.page.id} value={template.page.id}>
                  <Typography>{template.page.title}</Typography>
                </MenuItem>
              ))}
            </Select>
          </Stack>
          <Stack flexDirection='row' gap={1}>
            <Button
              sx={{
                width: 'fit-content'
              }}
              variant='contained'
              color='primary'
              loading={isConnectingGithubRepository}
              disabled={!formState.isValid || disabled || !formState.isDirty}
              disabledTooltip={!formState.isValid ? 'Select a reward template and repository' : undefined}
              onClick={handleConnectGithubRepository}
            >
              Save
            </Button>
            <Button
              sx={{
                width: 'fit-content'
              }}
              variant='outlined'
              color='error'
              loading={isDisconnectingGithubApplication}
              disabled={disabled}
              onClick={handleDisconnect}
            >
              Disconnect
            </Button>
          </Stack>
        </Stack>
      </Grid>
    </Grid>
  );
}

export function ConnectGithubApp({ spaceId, spaceDomain }: { spaceId: string; spaceDomain: string }) {
  const isAdmin = useIsAdmin();
  const { data, isLoading: isLoadingGithubApplicationData } = useGetGithubApplicationData(spaceId);
  const { loading } = useGithubApp();

  return (
    <Grid container direction='row' gap={1} justifyContent='space-between' alignItems='center'>
      <Grid item>
        <Typography variant='body2'>Connect your space to Github to sync rewards and issues.</Typography>
      </Grid>
      {isAdmin &&
        (!data ? (
          <Grid item>
            <Button
              loading={loading || isLoadingGithubApplicationData}
              disabledTooltip={loading ? 'Connecting with CharmVerse Github App' : undefined}
              external
              href={`https://github.com/apps/dev-charmverse-integration/installations/new?state=${encodeURIComponent(
                JSON.stringify({
                  redirect: `${window?.location.origin}/${spaceDomain as string}`
                })
              )}`}
            >
              Connect
            </Button>
          </Grid>
        ) : (
          <ConnectedGithubAppSection
            installationId={data.spaceGithubCredential.installationId}
            spaceId={spaceId}
            repositories={data.repositories}
            rewardRepo={data.spaceGithubCredential.rewardsRepos[0]}
            githubAppName={data.spaceGithubCredential.name}
          />
        ))}
    </Grid>
  );
}
