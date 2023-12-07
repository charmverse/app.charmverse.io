import { ThemeProvider } from '@mui/material/styles';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

import { PageSidebarContext } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { SnackbarContext } from 'hooks/useSnackbar';
import { SpacesContext } from 'hooks/useSpaces';
import type { IContext } from 'hooks/useUser';
import { UserContext } from 'hooks/useUser';
import { createThemeLightSensitive } from 'theme';

import { createMockSpace } from './mocks/space';
import { createMockUser } from './mocks/user';

export const customRenderWithContext = (
  ui: ReactNode,
  { value, renderOptions }: { value?: Partial<IContext>; renderOptions?: RenderOptions }
) => {
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
                autoHideDuration: 5000,
                setAutoHideDuration: () => {},
                isOpen: false,
                handleClose: () => {},
                showMessage: () => {},
                actions: [],
                message: null,
                severity: 'info',
                setActions: () => {},
                setSeverity: () => {},
                setIsOpen: () => {},
                setMessage: () => {}
              }}
            >
              <PageSidebarContext.Provider
                value={{
                  activeView: null,
                  setActiveView: () => {},
                  persistedActiveView: null,
                  persistActiveView: () => {},
                  closeSidebar: () => {}
                }}
              >
                {ui}
              </PageSidebarContext.Provider>
            </SnackbarContext.Provider>
          </SpacesContext.Provider>
        </UserContext.Provider>
      </ThemeProvider>
    </SWRConfig>,
    renderOptions || {
      hydrate: true
    }
  );
};

export const renderWithTheme = (ui: ReactNode, renderOptions?: RenderOptions) => {
  const theme = createThemeLightSensitive('light');

  return render(
    <ThemeProvider theme={theme}>{ui}</ThemeProvider>,
    renderOptions || {
      hydrate: true
    }
  );
};
