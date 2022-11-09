import { datadogLogs } from '@datadog/browser-logs';
import { datadogRum } from '@datadog/browser-rum';
import { createContext, useContext, useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

import { useUser } from './useUser';

type IContext = {
  datadogLogs: typeof datadogLogs | null;
  datadogRum: typeof datadogRum | null;
};

export const LoggerContext = createContext<Readonly<IContext>>({
  datadogLogs,
  datadogRum
});

const DD_SITE = 'datadoghq.com';

export function LoggerProvider ({ children }: { children: ReactNode }) {
  const { user } = useUser();

  // Load DD_LOGS
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN && process.env.NODE_ENV === 'production') {
      datadogLogs.init({
        clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN,
        site: DD_SITE,
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
    if (process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN && process.env.NEXT_PUBLIC_DD_RUM_APP_ID && process.env.NODE_ENV === 'production') {
      datadogRum.init({
        applicationId: process.env.NEXT_PUBLIC_DD_RUM_APP_ID,
        clientToken: process.env.NEXT_PUBLIC_DD_RUM_CLIENT_TOKEN,
        site: DD_SITE,
        service: 'charmverseapp',
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
    if (user && process.env.NODE_ENV === 'production') {
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
  }, [user]);

  const value = useMemo(() => ({
    datadogLogs,
    datadogRum
  }), []);

  return (
    <LoggerContext.Provider value={value}>
      {children}
    </LoggerContext.Provider>
  );
}

export const useLogger = () => useContext(LoggerContext);
