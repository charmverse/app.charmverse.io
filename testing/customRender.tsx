import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { IContext } from 'hooks/useUser';
import { UserContext } from 'hooks/useUser';
import { createThemeLightSensitive } from 'theme';

import { createMockUser } from './mocks/user';

export const customRenderWithContext = (ui: ReactNode, { value, ...renderOptions }: { value?: Partial<IContext> }) => {
  const theme = createThemeLightSensitive('light');

  return render(
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
        {ui}
      </UserContext.Provider>
    </ThemeProvider>,
    renderOptions
  );
};
