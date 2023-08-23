import { SWRConfig } from 'swr';

import { SnackbarProvider } from 'hooks/useSnackbar';
import { SpacesProvider } from 'hooks/useSpaces';
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
          <UserProvider>
            <SpacesProvider>{children}</SpacesProvider>
          </UserProvider>
        </SWRConfig>
      </SnackbarProvider>
    </AppThemeProvider>
  );
}
