import env from '@beam-australia/react-env';
import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { isProdEnv, isStagingEnv } from '@root/config/constants';
import { useEffect } from 'react';

import { useCurrentSpace } from 'hooks/useCurrentSpace';
import { useUser } from 'hooks/useUser';

const DD_SITE = 'datadoghq.com';
const DD_SERVICE = 'webapp-browser';

const appEnv = isStagingEnv ? 'stg' : isProdEnv ? 'prd' : 'dev';

export default function useDatadogLogger() {
  const { user } = useUser();
  const { space } = useCurrentSpace();

  // Load DD_LOGS
  useEffect(() => {
    if (env('DD_CLIENT_TOKEN') && isProdEnv) {
      datadogLogs.init({
        clientToken: env('DD_CLIENT_TOKEN'),
        site: DD_SITE,
        service: DD_SERVICE,
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
        env: appEnv,
        version: env('BUILD_ID')
      });
    }
  }, []);

  // Load DD_RUM_LOGS
  useEffect(() => {
    if (env('DD_RUM_CLIENT_TOKEN') && env('DD_RUM_APP_ID') && isProdEnv) {
      datadogRum.init({
        applicationId: env('DD_RUM_APP_ID'),
        clientToken: env('DD_RUM_CLIENT_TOKEN'),
        site: DD_SITE,
        service: DD_SERVICE,
        sampleRate: 100,
        sessionReplaySampleRate: 20,
        trackInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
        env: appEnv,
        version: env('BUILD_ID')
      });

      datadogRum.startSessionReplayRecording();
    }

    return () => datadogRum.stopSessionReplayRecording();
  }, []);

  // Load the user id for DD_LOGS & DD_RUM_LOGS
  useEffect(() => {
    if (user && isProdEnv) {
      datadogLogs.onReady(() => {
        datadogLogs.setUser({ id: user.id });
      });
      datadogRum.onReady(() => {
        datadogRum.setUser({ id: user.id });
      });
    }

    return () => {
      datadogLogs.clearUser();
      datadogRum.clearUser();
    };
  }, [user?.id]);

  // Add space id to context
  useEffect(() => {
    if (space && isProdEnv) {
      datadogLogs.onReady(() => {
        datadogLogs.setGlobalContext({ spaceId: space.id });
      });
      datadogRum.onReady(() => {
        datadogRum.setGlobalContext({ spaceId: space.id });
      });
    }

    return () => {
      datadogLogs.setGlobalContext({ spaceId: null });
      datadogRum.setGlobalContext({ spaceId: null });
    };
  }, [space?.id]);
}
