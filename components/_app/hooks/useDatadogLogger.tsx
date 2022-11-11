import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { useEffect } from 'react';

import { isProdEnv } from 'config/constants';

import { useUser } from '../../../hooks/useUser';

const DD_SITE = 'datadoghq.com';
const DD_SERVICE = 'charmverseapp';

export default function useDatadogLogger () {
  const { user } = useUser();

  // Load DD_LOGS
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN && isProdEnv) {
      datadogLogs.init({
        clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
        site: DD_SITE,
        service: DD_SERVICE,
        forwardErrorsToLogs: true,
        sampleRate: 100,
        env: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_BUILD_ID,
        forwardConsoleLogs: ['error']
      });
    }
  }, []);

  // Load DD_RUM_LOGS
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN && process.env.NEXT_PUBLIC_DD_RUM_APP_ID && isProdEnv) {
      datadogRum.init({
        applicationId: process.env.NEXT_PUBLIC_DD_RUM_APP_ID,
        clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN,
        site: DD_SITE,
        service: DD_SERVICE,
        sampleRate: 100,
        sessionReplaySampleRate: 100,
        trackInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
        env: process.env.NODE_ENV,
        version: process.env.NEXT_PUBLIC_BUILD_ID
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
}
