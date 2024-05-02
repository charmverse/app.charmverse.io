import { Stack, Typography } from '@mui/material';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Button } from 'components/common/Button';
import LoadingComponent from 'components/common/LoadingComponent';
import { useCharmRouter } from 'hooks/useCharmRouter';
import { useGithubApp } from 'hooks/useGithubApp';
import { useSpaceFeatures } from 'hooks/useSpaceFeatures';
import { GITHUB_APP_NAME } from 'lib/github/constants';

import { IntegrationContainer } from '../IntegrationContainer';

import { GithubSettingsForm } from './GithubSettingsForm';

export function GithubSettings({
  isAdmin,
  spaceId,
  spaceDomain
}: {
  isAdmin: boolean;
  spaceId: string;
  spaceDomain: string;
}) {
  const { router, clearURLQuery } = useCharmRouter();
  const { getFeatureTitle } = useSpaceFeatures();
  const [expanded, setExpanded] = useState(false);
  const { isConnectingWithGithubApp, isLoadingGithubApplicationData, githubApplicationData } = useGithubApp({
    spaceId
  });

  useEffect(() => {
    const openByDefault = router.query.section === 'github';
    if (openByDefault) {
      setExpanded(true);
      clearURLQuery();
    }
  }, [router.isReady]);

  return (
    <IntegrationContainer
      isConnected={!!githubApplicationData}
      expanded={expanded}
      setExpanded={setExpanded}
      title='Github'
      subheader={`Link issues to ${getFeatureTitle('rewards')}`}
    >
      <Stack gap={2}>
        {isLoadingGithubApplicationData || isConnectingWithGithubApp ? (
          <LoadingComponent />
        ) : !githubApplicationData ? (
          <>
            <Typography variant='body2'>
              Connect a Git repository to CharmVerse to create {getFeatureTitle('rewards')} from GitHub issues.
            </Typography>
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
                    redirect: `${window?.location.origin}/${spaceDomain}/members?settingTab=integrations&section=github`
                  })
                )}`}
              >
                Authorize
              </Button>
            </div>
          </>
        ) : (
          <GithubSettingsForm
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
