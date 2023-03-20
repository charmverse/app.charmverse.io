import { ThemeProvider } from '@mui/material/styles';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { IContext } from 'hooks/useUser';
import { UserContext } from 'hooks/useUser';
import { createThemeLightSensitive } from 'theme';

import { mockedUser } from './mocks/user';

const theme = createThemeLightSensitive('light');

export const customRenderWithContext = (ui: ReactNode, { value, ...renderOptions }: { value?: Partial<IContext> }) => {
  return render(
    <ThemeProvider theme={theme}>
      <UserContext.Provider
        value={{
          user: mockedUser,
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
