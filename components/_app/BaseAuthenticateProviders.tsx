import { SWRConfig } from 'swr';

import { SnackbarProvider } from 'hooks/useSnackbar';
import { UserProvider } from 'hooks/useUser';
import { AppThemeProvider } from 'theme/AppThemeProvider';

export function BaseAuthenticateProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppThemeProvider>
      <SnackbarProvider>
        <SWRConfig
          value={{
            shouldRetryOnError(err) {
              return err.status >= 500;
            }
          }}
        >
          <UserProvider>{children}</UserProvider>
        </SWRConfig>
      </SnackbarProvider>
    </AppThemeProvider>
  );
}
