import env from '@beam-australia/react-env';
import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { isProdEnv, isStagingEnv } from '@packages/config/constants';
import { useEffect } from 'react';

const DD_SITE = 'datadoghq.com';

const appEnv = isStagingEnv ? 'stg' : isProdEnv ? 'prd' : 'dev';

export function useDatadogLogger({ service, userId, spaceId }: { service: string; spaceId?: string; userId?: string }) {
  // Load DD_LOGS
  useEffect(() => {
    if (env('DD_CLIENT_TOKEN') && isProdEnv) {
      datadogLogs.init({
        clientToken: env('DD_CLIENT_TOKEN'),
        site: DD_SITE,
        service,
        forwardErrorsToLogs: true,
        sessionSampleRate: 100,
        env: appEnv,
        version: env('BUILD_ID')
      });
    }
  }, [service]);

  // Load DD_RUM_LOGS
  useEffect(() => {
    if (env('DD_RUM_CLIENT_TOKEN') && env('DD_RUM_APP_ID') && isProdEnv) {
      datadogRum.init({
        applicationId: env('DD_RUM_APP_ID'),
        clientToken: env('DD_RUM_CLIENT_TOKEN'),
        site: DD_SITE,
        service,
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
  }, [service]);

  // Load the user id for DD_LOGS & DD_RUM_LOGS
  useEffect(() => {
    if (userId && isProdEnv) {
      datadogLogs.onReady(() => {
        datadogLogs.setUser({ id: userId });
      });
      datadogRum.onReady(() => {
        datadogRum.setUser({ id: userId });
      });
    }

    return () => {
      datadogLogs.clearUser();
      datadogRum.clearUser();
    };
  }, [userId]);

  // Add space id to context
  useEffect(() => {
    if (spaceId && isProdEnv) {
      datadogLogs.onReady(() => {
        datadogLogs.setGlobalContext({ spaceId });
      });
      datadogRum.onReady(() => {
        datadogRum.setGlobalContext({ spaceId });
      });
    }

    return () => {
      datadogLogs.setGlobalContext({ spaceId: null });
      datadogRum.setGlobalContext({ spaceId: null });
    };
  }, [spaceId]);
}
