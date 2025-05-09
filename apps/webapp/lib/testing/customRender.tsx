/* eslint-disable react/jsx-no-constructed-context-values */
import { ThemeProvider } from '@mui/material/styles';
import { createMockSpace } from '@packages/testing/mocks/space';
import { createMockUser } from '@packages/testing/mocks/user';
import type { RenderOptions } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { SWRConfig } from 'swr';

import { PageSidebarContext } from 'components/[pageId]/DocumentPage/hooks/usePageSidebar';
import { SnackbarContext } from 'hooks/useSnackbar';
import { SpacesContext } from 'hooks/useSpaces';
import { ThreadsContext } from 'hooks/useThreads';
import type { IContext } from 'hooks/useUser';
import { UserContext } from 'hooks/useUser';
import { createThemeLightSensitive } from 'theme';

export { render };

export function MockDataProvider({ children, userContext }: { children: ReactNode; userContext?: Partial<IContext> }) {
  const theme = createThemeLightSensitive('light');
  const space = createMockSpace();

  return (
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
            setUser: () => Promise.resolve(undefined),
            updateUser: () => Promise.resolve(undefined),
            refreshUser: async () => Promise.resolve(undefined),
            logoutUser: async () => {},
            isLoaded: true,
            ...userContext
          }}
        >
          <SpacesContext.Provider
            value={{
              spaces: [space],
              memberSpaces: [],
              setSpace: () => {},
              setSpaces: () => {},
              isLoaded: true,
              createNewSpace: async () => ({}) as any,
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
                setMessage: () => {},
                showError: () => {}
              }}
            >
              <ThreadsContext.Provider
                value={{
                  isLoading: true,
                  threads: {},
                  currentPageId: null,
                  addComment: async () => {},
                  editComment: async () => {},
                  deleteComment: async () => {},
                  resolveThread: async () => {},
                  deleteThread: async () => {},
                  refetchThreads: () => {}
                }}
              >
                <PageSidebarContext.Provider
                  value={{
                    activeView: null,
                    setActiveView: () => {},
                    closeSidebar: () => {}
                  }}
                >
                  {children}
                </PageSidebarContext.Provider>
              </ThreadsContext.Provider>
            </SnackbarContext.Provider>
          </SpacesContext.Provider>
        </UserContext.Provider>
      </ThemeProvider>
    </SWRConfig>
  );
}

export const renderWithTheme = (ui: ReactNode, renderOptions?: RenderOptions) => {
  const theme = createThemeLightSensitive('light');

  return render(
    <ThemeProvider theme={theme}>{ui}</ThemeProvider>,
    renderOptions || {
      hydrate: true
    }
  );
};
