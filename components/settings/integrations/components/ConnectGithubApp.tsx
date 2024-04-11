import { Grid, Typography } from '@mui/material';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import { useGithubApp } from 'hooks/useGithubApp';
import { useIsAdmin } from 'hooks/useIsAdmin';
import { GITHUB_APP_NAME } from 'lib/github/constants';

import { ConnectGithubRepoForm } from './ConnectGithubRepoForm';

export const schema = yup.object({
  repositoryId: yup.string().required(),
  rewardTemplateId: yup.string().uuid().nullable(),
  repositoryName: yup.string().required(),
  rewardAuthorId: yup.string().uuid().required(),
  repositoryLabels: yup.array(yup.string())
});

export function ConnectGithubApp({ spaceId, spaceDomain }: { spaceId: string; spaceDomain: string }) {
  const isAdmin = useIsAdmin();
  const { isConnectingWithGithubApp, isLoadingGithubApplicationData, githubApplicationData } = useGithubApp({
    spaceId
  });

  return (
    <Grid container direction='row' gap={1} justifyContent='space-between' alignItems='center'>
      <Grid item>
        <Typography variant='body2'>Connect your space to Github to sync rewards and issues.</Typography>
      </Grid>
      {!githubApplicationData ? (
        <Grid item>
          <Button
            loading={isConnectingWithGithubApp || isLoadingGithubApplicationData}
            disabledTooltip={
              isConnectingWithGithubApp
                ? 'Connecting with CharmVerse Github App'
                : !isAdmin
                ? 'Only admins can connect to Github'
                : undefined
            }
            disabled={isConnectingWithGithubApp || !isAdmin}
            external
            href={`https://github.com/apps/${GITHUB_APP_NAME}/installations/new?state=${encodeURIComponent(
              JSON.stringify({
                redirect: `${window?.location.origin}/${spaceDomain}/rewards?settingTab=integrations`
              })
            )}`}
          >
            Connect
          </Button>
        </Grid>
      ) : (
        <ConnectGithubRepoForm
          installationId={githubApplicationData.spaceGithubConnection.installationId}
          spaceId={spaceId}
          repositories={githubApplicationData.repositories}
          rewardRepo={githubApplicationData.spaceGithubConnection.rewardsRepo}
          githubAppName={githubApplicationData.spaceGithubConnection.name}
        />
      )}
    </Grid>
  );
}
