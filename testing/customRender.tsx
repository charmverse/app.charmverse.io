import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

import { PageActionDisplayContext } from 'hooks/usePageActionDisplay';
import { SnackbarContext } from 'hooks/useSnackbar';
import { SpacesContext } from 'hooks/useSpaces';
import type { IContext } from 'hooks/useUser';
import { UserContext } from 'hooks/useUser';
import { createThemeLightSensitive } from 'theme';

import { createMockSpace, createMockUser } from './mocks/user';

export const customRenderWithContext = (ui: ReactNode, { value, ...renderOptions }: { value?: Partial<IContext> }) => {
  const theme = createThemeLightSensitive('light');
  const space = createMockSpace();

  return render(
    <SWRConfig
      value={{
        shouldRetryOnError(err) {
          return err.status >= 500;
        }
      }}
    >
      <ThemeProvider theme={theme}>
        <UserContext.Provider
          value={{
            user: createMockUser(),
            setUser: () => {},
            updateUser: () => {},
            setIsLoaded: () => {},
            refreshUser: async () => {},
            logoutUser: async () => {},
            isLoaded: true,
            ...value
          }}
        >
          <SpacesContext.Provider
            value={{
              spaces: [space],
              memberSpaces: [],
              setSpace: () => {},
              setSpaces: () => {},
              isLoaded: true,
              createNewSpace: async () => ({} as any),
              isCreatingSpace: false
            }}
          >
            <SnackbarContext.Provider
              value={{
                isOpen: false,
                handleClose: () => {},
                showMessage: () => {},
                actions: [],
                message: null,
                origin: {
                  vertical: 'bottom',
                  horizontal: 'left'
                },
                severity: 'info',
                setActions: () => {},
                setSeverity: () => {},
                setIsOpen: () => {},
                setMessage: () => {}
              }}
            >
              <PageActionDisplayContext.Provider
                value={{ currentPageActionDisplay: null, setCurrentPageActionDisplay: () => {} }}
              >
                {ui}
              </PageActionDisplayContext.Provider>
            </SnackbarContext.Provider>
          </SpacesContext.Provider>
        </UserContext.Provider>
      </ThemeProvider>
    </SWRConfig>,
    renderOptions
  );
};
