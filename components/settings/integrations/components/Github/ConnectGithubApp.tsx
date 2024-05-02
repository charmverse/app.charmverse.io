import { Grid, Stack, Typography } from '@mui/material';
import { useState } from 'react';
import * as yup from 'yup';

import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useGithubApp } from 'hooks/useGithubApp';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { GITHUB_APP_NAME } from 'lib/github/constants';

import { IntegrationContainer } from '../IntegrationContainer';

import { ConnectGithubRepoForm } from './ConnectGithubRepoForm';

export const schema = yup.object({
  repositoryId: yup.string().required(),
  rewardTemplateId: yup.string().uuid().nullable(),
  repositoryName: yup.string().required(),
  rewardAuthorId: yup.string().uuid().required(),
  repositoryLabels: yup.array(yup.string())
});

export function ConnectGithubApp({
  isAdmin,
  spaceId,
  spaceDomain
}: {
  isAdmin: boolean;
  spaceId: string;
  spaceDomain: string;
}) {
  const { getFeatureTitle } = useSpaceFeatures();
  const [expanded, setExpanded] = useState(false);
  const { isConnectingWithGithubApp, isLoadingGithubApplicationData, githubApplicationData } = useGithubApp({
    spaceId
  });

  return (
    <IntegrationContainer
      isConnected={!!githubApplicationData}
      expanded={expanded}
      setExpanded={setExpanded}
      title='Github'
      subheader={`Link issues to ${getFeatureTitle('rewards')}`}
    >
      <Stack gap={2}>
        <Typography variant='body2'>
          Connect your space to GitHub to create {getFeatureTitle('rewards')} from GitHub issues.
        </Typography>
        {isLoadingGithubApplicationData || isConnectingWithGithubApp ? (
          <LoadingComponent />
        ) : !githubApplicationData ? (
          <div>
            <Button
              disabledTooltip={
                isConnectingWithGithubApp
                  ? 'Connecting with CharmVerse Github App'
                  : !isAdmin
                  ? 'Only admins can connect to Github'
                  : undefined
              }
              disabled={!isAdmin}
              external
              href={`https://github.com/apps/${GITHUB_APP_NAME}/installations/new?state=${encodeURIComponent(
                JSON.stringify({
                  redirect: `${window?.location.origin}/${spaceDomain}/rewards?settingTab=integrations`
                })
              )}`}
            >
              Connect
            </Button>
          </div>
        ) : (
          <ConnectGithubRepoForm
            installationId={githubApplicationData.spaceGithubConnection.installationId}
            spaceId={spaceId}
            repositories={githubApplicationData.repositories}
            rewardRepo={githubApplicationData.spaceGithubConnection.rewardsRepo}
            githubAppName={githubApplicationData.spaceGithubConnection.name}
          />
        )}
      </Stack>
    </IntegrationContainer>
  );
}
