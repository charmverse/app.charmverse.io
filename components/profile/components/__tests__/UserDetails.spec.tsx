import { ThemeProvider } from '@mui/material/styles';
import type { UserDetails } from '@prisma/client';
import { fireEvent, render, screen } from '@testing-library/react';

import type { LoggedInUser } from 'models';
import { IDENTITY_TYPES } from 'models';
import { createThemeLightSensitive } from 'theme';

import IdentityModal from '../IdentityModal';
import UserDetailsComponent from '../UserDetails';

const theme = createThemeLightSensitive('light');

const userDetails: UserDetails = {
  id: '1',
  description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis vitae quam quis ligula tincidunt euismod placerat vel augue. Praesent porta sapien et tincidunt ultrices.',
  social: {
    githubURL: 'https://github.com/charmverse',
    twitterURL: 'https://mobile.twitter.com/charmverse',
    linkedinURL: 'https://www.linkedin.com/in/alexchibunpoon/'
  },
  timezone: null
};

function WrappedUserDetails () {
  const props = {
    readOnly: false,
    user: {
      id: '1',
      createdAt: new Date(),
      updatedAt: new Date(),
      identityType: IDENTITY_TYPES[1],
      username: 'test.ens',
      wallets: [{ address: '0x0000000000000000000000000000000000000000' }]
    } as LoggedInUser,
    updateUser: () => {}
  };

  return (
    <ThemeProvider theme={theme}>
      <UserDetailsComponent {...props} />
    </ThemeProvider>
  );
}

jest.mock('../IdentityModal', () => ({
  __esModule: true,
  default: () => IdentityModal,
  getIdentityIcon: jest.fn()
}));

jest.mock('public/images/discord_logo.svg', () => ({
  __esModule: true,
  default: () => null
}));

jest.mock('swr/immutable', () => ({
  __esModule: true,
  default: () => ({
    data: userDetails,
    mutate: () => {}
  })
}));

describe('User details', () => {

  it('should have correct username displayed', () => {
    render(<WrappedUserDetails />);
    expect(screen.getByText('test.ens')).toBeTruthy();
  });

  it('should have Twitter, GitHub, Linkedin icons', () => {
    render(<WrappedUserDetails />);
    expect(screen.getByTestId('TwitterIcon')).toBeTruthy();
    expect(screen.getByTestId('GitHubIcon')).toBeTruthy();
    expect(screen.getByTestId('LinkedInIcon')).toBeTruthy();
  });

  it('should have description', () => {
    render(<WrappedUserDetails />);
    expect(screen.getByText(userDetails.description as string)).toBeTruthy();
  });

  it('should have edit icons', () => {
    render(<WrappedUserDetails />);
    expect(screen.getByTestId('edit-identity')).toBeTruthy();
    expect(screen.getByTestId('edit-social')).toBeTruthy();
    expect(screen.getByTestId('edit-description')).toBeTruthy();
  });

  it('should open description modal', () => {
    render(<WrappedUserDetails />);
    fireEvent.click(screen.getByTestId('edit-description'));
    expect(screen.getByText('Describe yourself in a few words')).toBeTruthy();
  });

});
